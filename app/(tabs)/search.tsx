import AllergenWarning from "@/components/AllergenWarning";
import { Colors } from "@/constants/Colors";
import { API_BASE } from "@/src/constants/api";
import { analyzeFood } from "@/src/lib/allergenChecker";
import { auth } from "@/src/lib/auth";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { saveFood } from "../src/api/savedFoods";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";

interface Food {
  id: string;
  name: string;
  brand?: string;
  servingUnit?: string;
  servingQty?: number;

  //UI/old shape
  kcal?: number;

  //external API form to stop 0kcal responses
  calories?: number;
  energyKcal?: number;
  externalId?: string;

  macros?: any;
}


interface MealItem {
  food: Food;
  qty: number;
}

export default function AddSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [mealType, setMealType] = useState("breakfast");
  const [allergenAnalysis, setAllergenAnalysis] = useState<any>(null);

  const searchFoods = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFoods([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/foods?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setFoods(data);
      }
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search foods. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchFoods(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchFoods]);
  const handleSaveFood = async (food: Food) => {
  try {
    await saveFood({
      foodId: food.id,
      id: food.id,
      externalId: food.externalId ?? null,
      barcode: (food as any).barcode ?? null,
      name: food.name,
      brand: food.brand ?? null,
      kcal: getFoodKcal(food),
      servingQty: food.servingQty ?? null,
      servingUnit: food.servingUnit ?? null,
      imageUrl: (food as any).imageUrl ?? null,
      source: (food as any).source ?? "UPC_API",
    });
    Alert.alert("Saved", `${food.name} saved`);
  } catch (e: any) {
    Alert.alert("Error", e?.message || "Failed to save");
  }
};

  const handleFoodSelect = async (food: Food) => {
    setSelectedFood(food);
    
    // Check for allergens
    const foodTags = [food.name.toLowerCase()];
    if (food.brand) {
      foodTags.push(food.brand.toLowerCase());
    }
    const analysis = await analyzeFood(foodTags);
    setAllergenAnalysis(analysis);
    
    setQuantityModalVisible(true);
  };

  const handleAddToMeal = () => {
    if (!selectedFood) return;
    
    const qty = parseFloat(String(quantity).replace(/[^\d.]/g, "")) || 1;
    setMealItems([...mealItems, { food: selectedFood, qty }]);
    setQuantityModalVisible(false);
    setSelectedFood(null);
    setQuantity("1");
    Alert.alert("Added!", `${selectedFood.name} added to your meal.`);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = mealItems.filter((_, i) => i !== index);
    setMealItems(newItems);
  };

  const handleSaveMeal = async () => {
    if (mealItems.length === 0) {
      Alert.alert("Empty Meal", "Please add at least one food item to your meal.");
      return;
    }

    try {
      const token = await auth.getToken();
      if (!token) {
        Alert.alert("Not Authenticated", "Please log in to save meals.");
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
          meal_type: mealType,
          items: mealItems.map((item) => ({
          food_id: item.food.id ?? null,              //keep if it exists
          externalId: item.food.externalId ?? null,   //allow server to resolve/create
          name: item.food.name,
          brand: item.food.brand ?? null,
          kcal: item.food.kcal ?? null,
          qty: item.qty,
          })),
        }),
      });

      if (response.ok) {
        Alert.alert(
          "Success!",
          "Your meal has been saved.",
          [
            {
              text: "OK",
              onPress: () => {
                setMealItems([]);
                router.back();
              },
            },
          ]
        );
      } else {
        const msg = await response.text().catch(() => "");
        throw new Error(msg || "Failed to save meal");
      }
    } catch (error) {
      console.error("Save meal error:", error);
      Alert.alert("Error", "Failed to save meal. Please try again.");
    }
  };

    const getFoodKcal = (food: Food | null | undefined) => {
    const v = Number((food as any)?.kcal ?? (food as any)?.calories ?? (food as any)?.energyKcal);
    return Number.isFinite(v) ? v : 0;
  };

  const getFoodKcalForQty = (food: Food, qty: number) => {
    const baseKcal = getFoodKcal(food);

    // If servingUnit is grams and servingQty exists (often "100 g"),
    // scale calories proportionally. Otherwise treat qty as "servings".
    const unit = String(food.servingUnit ?? "").toLowerCase();
    const baseQty = Number(food.servingQty);

    const looksLikeGrams = unit === "g" || unit.includes("gram");
    if (looksLikeGrams && Number.isFinite(baseQty) && baseQty > 0) {
      return baseKcal * (qty / baseQty);
    }

    return baseKcal * qty;
  };

  const getTotalCalories = () => {
    return mealItems.reduce((sum, item) => {
      return sum + getFoodKcalForQty(item.food, item.qty);
    }, 0);
  };


  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={18} color={Colors.neutral.mutedGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for foods..."
            placeholderTextColor={Colors.neutral.mutedGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome name="times-circle" size={18} color={Colors.neutral.mutedGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Meal Summary Bar */}
      {mealItems.length > 0 && (
        <View style={styles.mealSummary}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              {mealItems.length} item{mealItems.length > 1 ? "s" : ""} • {Math.round(getTotalCalories())} kcal
            </Text>
            <TouchableOpacity onPress={handleSaveMeal} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save Meal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Meal Items Preview */}
      {mealItems.length > 0 && (
        <ScrollView 
          horizontal 
          style={styles.mealItemsPreview}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealItemsContent}
        >
          {mealItems.map((item, index) => (
            <View key={index} style={styles.mealItemChip}>
              <Text style={styles.mealItemName} numberOfLines={1}>
                {item.food.name} ({item.qty}x)
              </Text>
              <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                <FontAwesome name="times" size={12} color={Colors.neutral.mutedGray} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

            {/* Search Results */}
      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        keyboardShouldPersistTaps="handled"
      >
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary.green} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {!loading && searchQuery.length > 0 && foods.length === 0 && (
          <View style={styles.centerContainer}>
            <FontAwesome name="search" size={48} color={Colors.neutral.mutedGray} />
            <Text style={styles.emptyText}>No foods found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        )}

        {!loading && searchQuery.length === 0 && (
          <View style={styles.centerContainer}>
            <FontAwesome name="search" size={48} color={Colors.neutral.mutedGray} />
            <Text style={styles.emptyText}>Start typing to search</Text>
            <Text style={styles.emptySubtext}>Find foods from our database</Text>
          </View>
        )}

        {foods.map((food, idx) => {
          const key =
            String(food?.id ?? (food as any)?.externalId ?? `${food?.name ?? "food"}-${food?.brand ?? ""}`) +
            "-" +
            idx; //idx suffix guarantees uniqueness even if ids repeat

          const kcalVal = getFoodKcal(food);
          const servingQty = Number(food.servingQty);
          const servingUnit = String(food.servingUnit ?? "").trim();

          return (
            <TouchableOpacity
              key={key}
              style={styles.foodCard}
              onPress={() => handleFoodSelect(food)}
              activeOpacity={0.7}
            >
              <View style={styles.foodCardContent}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  {!!food.brand && <Text style={styles.foodBrand}>{food.brand}</Text>}
                  {servingUnit ? (
                    <Text style={styles.foodServing}>
                      {Number.isFinite(servingQty) && servingQty > 0 ? servingQty : 1} {servingUnit}
                    </Text>
                  ) : (
                    <Text style={styles.foodServing}>1 serving</Text>
                  )}
                </View>

                {kcalVal > 0 && (
                  <View style={styles.calorieBadge}>
                    <Text style={styles.calorieText}>{Math.round(kcalVal)}</Text>
                    <Text style={styles.calorieUnit}>kcal</Text>
                  </View>
                )}
              </View>

              <FontAwesome name="plus-circle" size={24} color={Colors.primary.green} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Quantity Modal */}
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
            {selectedFood && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedFood.name}</Text>
                  {selectedFood.brand && (
                    <Text style={styles.modalBrand}>{selectedFood.brand}</Text>
                  )}
                </View>

                {selectedFood && allergenAnalysis && (allergenAnalysis.hasAllergenWarning || allergenAnalysis.hasDietaryConflict) && (
                  <AllergenWarning 
                    analysis={allergenAnalysis} 
                    variant="compact"
                  />
                )}

                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}></Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numbers-and-punctuation"
                    onSubmitEditing={handleAddToMeal}
                    placeholder="1"
                  />
                  {selectedFood.servingUnit && (
                    <Text style={styles.quantityUnit}>{selectedFood.servingUnit}</Text>
                  )}
                </View>

                {selectedFood && (
                  <View style={styles.caloriePreview}>
                    <Text style={styles.caloriePreviewText}>
                      {Math.round(
                        getFoodKcalForQty(
                          selectedFood,
                          parseFloat(String(quantity).replace(/[^\d.]/g, "")) || 1
                        )
                      )}{" "}
                      kcal
                    </Text>
                  </View>
                )}


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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.backgroundLight,
  },
  searchHeader: {
    backgroundColor: Colors.neutral.cardSurface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.textDark,
  },
  mealSummary: {
    backgroundColor: Colors.primary.green,
    padding: 12,
  },
  summaryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: Colors.primary.green,
    fontSize: 14,
    fontWeight: "700",
  },
  mealItemsPreview: {
    maxHeight: 60,
    backgroundColor: Colors.neutral.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  mealItemsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  mealItemChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.backgroundLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 8,
  },
  mealItemName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    maxWidth: 120,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.neutral.mutedGray,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.neutral.textDark,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.neutral.mutedGray,
  },
  foodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  foodCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginBottom: 4,
  },
  foodBrand: {
    fontSize: 13,
    color: Colors.neutral.mutedGray,
    marginBottom: 4,
  },
  foodServing: {
    fontSize: 12,
    color: Colors.neutral.mutedGray,
  },
  calorieBadge: {
    alignItems: "center",
    backgroundColor: `${Colors.primary.green}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
  },
  calorieText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary.green,
  },
  calorieUnit: {
    fontSize: 10,
    color: Colors.primary.green,
    textTransform: "uppercase",
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
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    marginBottom: 4,
  },
  modalBrand: {
    fontSize: 14,
    color: Colors.neutral.mutedGray,
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
  caloriePreview: {
    backgroundColor: `${Colors.primary.green}10`,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  caloriePreviewText: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary.green,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
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

});
