import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { API_BASE } from "@/src/constants/api";

type AiResult = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  error?: string;
};

export default function PhotoTab() {
  const camRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null); // ✅ store base64 safely
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);

  if (!permission) return <View style={{ flex: 1 }} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera permission needed</Text>
        <TouchableOpacity style={styles.btnDark} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePhoto = async () => {
    setResult(null);
    setPhotoBase64(null);

    try {
      const shot = await camRef.current?.takePictureAsync({ quality: 0.8 });
      if (!shot?.uri) return;

      // ✅ Resize + compress + generate base64 (works on iOS/Android/Web)
      const resized = await ImageManipulator.manipulateAsync(
        shot.uri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.75,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true, // ✅ KEY FIX
        }
      );

      setPhotoUri(resized.uri);
      setPhotoBase64(resized.base64 ?? null);
    } catch (e: any) {
      Alert.alert("Camera error", String(e?.message ?? e));
    }
  };

  const recognize = async () => {
    if (!photoUri) {
      Alert.alert("No photo", "Take a photo first.");
      return;
    }
    if (!photoBase64) {
      Alert.alert("No base64", "Base64 not generated. Retake the photo.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/analyze-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photoBase64 }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        setResult({
          name: "",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          ingredients: [],
          error: data?.error || `Request failed (${res.status})`,
        });
        return;
      }

      setResult(data);
    } catch (e: any) {
      setResult({
        name: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        ingredients: [],
        error: String(e?.message ?? e),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {!photoUri ? (
        <CameraView ref={camRef} style={{ flex: 1 }} facing="back" />
      ) : (
        <Image
          source={{ uri: photoUri }}
          style={{ flex: 1 }}
          resizeMode="cover"
        />
      )}

      <View style={styles.bottom}>
        <View style={styles.row}>
          <TouchableOpacity style={styles.btnLight} onPress={takePhoto}>
            <Text>Take photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGray}
            onPress={() => {
              setPhotoUri(null);
              setPhotoBase64(null);
              setResult(null);
            }}
          >
            <Text>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnGreen, (!photoUri || loading) && { opacity: 0.6 }]}
            onPress={recognize}
            disabled={!photoUri || loading}
          >
            <Text>Recognize</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator style={{ marginTop: 10 }} />}

        {result?.error ? (
          <Text style={styles.err}>Error: {result.error}</Text>
        ) : result ? (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.ok}>Food: {result.name}</Text>
            <Text style={styles.ok}>Calories: {result.calories}</Text>
            <Text style={styles.ok}>Protein: {result.protein} g</Text>
            <Text style={styles.ok}>Carbs: {result.carbs} g</Text>
            <Text style={styles.ok}>Fat: {result.fat} g</Text>

            {!!result.ingredients?.length && (
              <Text style={styles.ok}>
                Ingredients: {result.ingredients.join(", ")}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.hint}>Take a photo, then tap Recognize.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: { fontSize: 18, marginBottom: 12 },
  bottom: { padding: 12, backgroundColor: "rgba(0,0,0,0.75)" },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  btnDark: { padding: 12, backgroundColor: "#222", borderRadius: 8 },
  btnText: { color: "white" },
  btnLight: { padding: 12, backgroundColor: "white", borderRadius: 8 },
  btnGray: { padding: 12, backgroundColor: "#ddd", borderRadius: 8 },
  btnGreen: { padding: 12, backgroundColor: "#4ade80", borderRadius: 8 },
  hint: { color: "white", marginTop: 10 },
  ok: { color: "white", marginTop: 10 },
  err: { color: "#f87171", marginTop: 10 },
});