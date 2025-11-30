import { API_BASE } from "@/app/constants/api";
import { analyzeFood } from "@/app/lib/allergenChecker";
import { auth } from "@/app/lib/auth";
import AllergenWarning from "@/components/AllergenWarning";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Food {
  id: string;
  name: string;
  brand?: string;
  servingUnit?: string;
  servingQty?: number;
  kcal?: number;
  macros?: any;
}

export default function AddBarcode() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualScan, setManualScan] = useState(false);
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [allergenAnalysis, setAllergenAnalysis] = useState<any>(null);
  const [isSafe, setIsSafe] = useState<boolean | null>(null);
  // no camera ref — we use CameraView for live scanning and ImagePicker for photo fallback

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || scanning) return;
    // If we were in manual-scan mode, disable it once a barcode is detected
    if (manualScan) setManualScan(false);
    setScanning(true);
    setScanned(true);
    setLoading(true);
    setError(null);
    setFood(null);
    setIsSafe(null);

    try {
      const response = await fetch(`${API_BASE}/barcode/${data}`);
      
      if (response.status === 404) {
        setError("Barcode not found in database");
        setScanning(false);
        Alert.alert("Not Found", "Barcode not found in our database.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch food data");
      }

      const foodData: Food = await response.json();
      setFood(foodData);

      // Check for allergens
      const foodTags = [foodData.name.toLowerCase()];
      if (foodData.brand) {
        foodTags.push(foodData.brand.toLowerCase());
      }
      const analysis = await analyzeFood(foodTags);
      setAllergenAnalysis(analysis);
      
      // Determine if safe
      const safe = !analysis.hasAllergenWarning && !analysis.hasDietaryConflict;
      setIsSafe(safe);

      setQuantityModalVisible(true);
    } catch (err: any) {
      console.error("Barcode scan error:", err);
      setError(err.message || "Failed to process barcode. Please try again.");
      Alert.alert("Scan Error", err.message || "Failed to process barcode. Please try again.");
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  // Trigger a one-shot capture/scan window. Enables manualScan for a short
  // period so the `onBarcodeScanned` handler can fire once a barcode is
  // detected. This provides an explicit "Capture" button behavior.
  const triggerOneShotScan = () => {
    if (scanning || scanned) return;
    setError(null);
    setFood(null);
    setIsSafe(null);
    setManualScan(true);

    // Disable manual mode after a timeout to avoid leaving it on forever.
    setTimeout(() => {
      // If still not scanned, notify the user and turn off manual mode.
      if (!scanned) {
        setManualScan(false);
        setError("No barcode detected");
        Alert.alert(
          "No barcode detected",
          "We couldn't find a barcode. Try moving the camera closer or use the Photo option.",
        );
      } else {
        setManualScan(false);
      }
    }, 8000);
  };

  // Take a photo using the system camera UI and POST it to the server decode endpoint.
  const takePictureAndDecode = async () => {
    if (scanning || scanned) return;
    setLoading(true);
    setError(null);
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== "granted") {
        Alert.alert("Permission required", "Camera permission is required to take a photo.");
        setLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: false });
      if ((result as any).cancelled || (result as any).canceled) {
        setLoading(false);
        return;
      }

      const uri = (result as any).uri || (result as any).assets?.[0]?.uri;
      if (!uri) {
        setError("No photo taken");
        Alert.alert("No photo", "No photo was taken.");
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append("image", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      const resp = await fetch(`${API_BASE}/barcode/decode`, {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
      });

      if (resp.status === 404) {
        setError("Barcode not found in image");
        Alert.alert("Not Found", "No barcode was detected in the photo.");
        return;
      }

      if (!resp.ok) throw new Error("Failed to decode barcode from image");

      const json = await resp.json();
      if (json.code) {
        await handleBarCodeScanned({ data: json.code });
      } else if (json.id || json.name) {
        const foodData = json as Food;
        setFood(foodData);
        const foodTags = [foodData.name.toLowerCase()];
        if (foodData.brand) foodTags.push(foodData.brand.toLowerCase());
        const analysis = await analyzeFood(foodTags);
        setAllergenAnalysis(analysis);
        setIsSafe(!analysis.hasAllergenWarning && !analysis.hasDietaryConflict);
        setQuantityModalVisible(true);
      } else {
        setError("No barcode found in the photo");
        Alert.alert("No barcode detected", "We couldn't find a barcode in the photo. Try retaking the picture or use the live scanner.");
      }
    } catch (err: any) {
      console.error("Photo decode error:", err);
      setError(err.message || "Failed to decode image");
      Alert.alert("Decode Error", err.message || "Failed to decode the image. Try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleReset = () => {
    setScanned(false);
    setFood(null);
    setError(null);
    setQuantity("1");
    setIsSafe(null);
    setAllergenAnalysis(null);
  };

  const handleAddToMeal = async () => {
    if (!food) return;

    try {
      const token = await auth.getToken();
      if (!token) {
        Alert.alert("Not Authenticated", "Please log in to add meals.");
        return;
      }

      const now = new Date();
      const response = await fetch(`${API_BASE}/meals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          occurred_at: now.toISOString(),
          meal_type: "snack",
          items: [{
            food_id: food.id,
            qty: parseFloat(quantity) || 1,
          }],
        }),
      });

      if (response.ok) {
        Alert.alert(
          "Success!",
          `${food.name} has been added to your meal.`,
          [
            {
              text: "OK",
              onPress: () => {
                setQuantityModalVisible(false);
                handleReset();
                router.back();
              },
            },
          ]
        );
      } else {
        throw new Error("Failed to save meal");
      }
    } catch (err: any) {
      console.error("Add to meal error:", err);
      Alert.alert("Error", "Failed to add to meal. Please try again.");
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary.green} />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <FontAwesome name="camera" size={64} color={Colors.neutral.mutedGray} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to scan barcodes and check product safety.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={manualScan && !scanned ? handleBarCodeScanned : undefined}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top Info */}
          <View style={styles.topInfo}>
            <View style={styles.infoCard}>
              <FontAwesome name="barcode" size={20} color={Colors.primary.green} />
              <Text style={styles.infoText}>Point at barcode</Text>
            </View>
          </View>

          {/* Scanning Frame */}
          <View style={styles.frameContainer}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {loading && (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color={Colors.primary.green} />
                <Text style={styles.loadingCardText}>Processing...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorCard}>
                <FontAwesome name="exclamation-circle" size={20} color={Colors.primary.orange} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && scanned && (
              <TouchableOpacity style={styles.scanAgainButton} onPress={handleReset}>
                <FontAwesome name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.scanAgainText}>Scan Again</Text>
              </TouchableOpacity>
            )}
            {/* Manual capture button: enables one-shot scanning when pressed */}
            {!loading && !error && !scanned && (
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  manualScan ? styles.captureButtonActive : {},
                ]}
                onPress={triggerOneShotScan}
              >
                <FontAwesome name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.captureButtonText}>
                  {manualScan ? "Scanning..." : "Capture"}
                </Text>
              </TouchableOpacity>
            )}
            {/* Photo-capture fallback: take picture and send to server for decode */}
            {!loading && !error && !scanned && (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={takePictureAndDecode}
              >
                <FontAwesome name="image" size={16} color="#FFFFFF" />
                <Text style={styles.photoButtonText}>Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>

      {/* Food Result Modal */}
      <Modal
        visible={quantityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuantityModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setQuantityModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {food && (
                <>
                  {/* Safety Status */}
                  {isSafe !== null && (
                    <View
                      style={[
                        styles.safetyBadge,
                        isSafe ? styles.safeBadge : styles.unsafeBadge,
                      ]}
                    >
                      <FontAwesome
                        name={isSafe ? "check-circle" : "exclamation-triangle"}
                        size={24}
                        color="#FFFFFF"
                      />
                      <Text style={styles.safetyText}>
                        {isSafe ? "Safe for You!" : "⚠️ Check Warning"}
                      </Text>
                    </View>
                  )}

                  {/* Food Info */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{food.name}</Text>
                    {food.brand && (
                      <Text style={styles.modalBrand}>{food.brand}</Text>
                    )}
                    {food.servingUnit && (
                      <Text style={styles.modalServing}>
                        {food.servingQty || 1} {food.servingUnit}
                      </Text>
                    )}
                  </View>

                  {/* Allergen Warnings */}
                  {allergenAnalysis &&
                    (allergenAnalysis.hasAllergenWarning ||
                      allergenAnalysis.hasDietaryConflict) && (
                      <AllergenWarning 
                        analysis={allergenAnalysis} 
                        variant="full"
                      />
                    )}

                  {/* Calorie Info */}
                  {food.kcal && (
                    <View style={styles.calorieCard}>
                      <Text style={styles.calorieLabel}>Calories</Text>
                      <Text style={styles.calorieValue}>
                        {Math.round(food.kcal)} kcal
                      </Text>
                    </View>
                  )}

                  {/* Quantity Input */}
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Quantity</Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="decimal-pad"
                      placeholder="1"
                    />
                    {food.servingUnit && (
                      <Text style={styles.quantityUnit}>{food.servingUnit}</Text>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setQuantityModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.addButton]}
                      onPress={handleAddToMeal}
                    >
                      <Text style={styles.addButtonText}>Add to Meal</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  topInfo: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
  },
  frameContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: Colors.primary.green,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomActions: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 16,
  },
  loadingCardText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    marginLeft: 12,
  },
  errorCard: {
    backgroundColor: "rgba(255, 159, 69, 0.95)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    minWidth: 300,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  retryButtonText: {
    color: Colors.primary.orange,
    fontSize: 14,
    fontWeight: "700",
  },
  scanAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.green,
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  scanAgainText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: Colors.neutral.backgroundLight,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.neutral.mutedGray,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: Colors.neutral.mutedGray,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: Colors.primary.green,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.neutral.cardSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  safetyBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  safeBadge: {
    backgroundColor: Colors.primary.green,
  },
  unsafeBadge: {
    backgroundColor: Colors.primary.orange,
  },
  safetyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    marginBottom: 4,
  },
  modalBrand: {
    fontSize: 16,
    color: Colors.neutral.mutedGray,
    marginBottom: 4,
  },
  modalServing: {
    fontSize: 14,
    color: Colors.neutral.mutedGray,
  },

  calorieCard: {
    backgroundColor: `${Colors.primary.green}10`,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  calorieLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.neutral.mutedGray,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.primary.green,
  },
  quantityContainer: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: Colors.neutral.backgroundLight,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.neutral.textDark,
  },
  quantityUnit: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.neutral.mutedGray,
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: Colors.neutral.backgroundLight,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.neutral.textDark,
  },
  addButton: {
    backgroundColor: Colors.primary.green,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.green,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 12,
  },
  captureButtonActive: {
    backgroundColor: Colors.primary.orange,
  },
  captureButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.green,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  photoButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
});
