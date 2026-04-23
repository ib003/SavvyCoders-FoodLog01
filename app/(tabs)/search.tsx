import AllergenWarning from "@/components/AllergenWarning";
import { KeyboardDismissAccessory, KEYBOARD_DISMISS_ACCESSORY_ID } from "@/components/ui/KeyboardDismissAccessory";
import { MealTypeSelector } from "@/components/ui/MealTypeSelector";
import { Colors } from "@/constants/Colors";
import { Theme } from "@/constants/Theme";
import { saveFood } from "@/src/_api/savedFoods";
import { API_BASE } from "@/src/constants/api";
import { analyzeFood } from "@/src/lib/allergenChecker";
import { auth } from "@/src/lib/auth";
import { MealTypeValue } from "@/src/lib/mealTypes";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {ActivityIndicator,Alert,Keyboard,Modal,Pressable,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View,
} from "react-native";

interface Food {
  id: number | string;
  name: string;
  brand?: string;
  servingUnit?: string;
  servingQty?: number;
  kcal?: number;
  calories?: number;
  energyKcal?: number;
  externalId?: string;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  ingredients?: string[];
  allergens?: string[];
  barcode?: string;
  imageUrl?: string;
  source?: string;
}

interface MealItem {
  food: Food;
  qty: number;
}

const normalizeFood = (item: any): Food => ({
  id: item?.id ?? item?.externalId ?? item?.name ?? Math.random().toString(),
  name: String(item?.name ?? "Unknown Food"),
  brand: item?.brand ?? undefined,
  servingUnit: item?.servingUnit || item?.serving_unit || "serving",
  servingQty: Number(item?.servingQty || item?.serving_qty || 1),
  kcal: Number(item?.kcal ?? item?.calories ?? item?.energyKcal ?? 0) || 0,
  calories: Number(item?.calories ?? item?.kcal ?? 0) || 0,
  energyKcal: Number(item?.energyKcal ?? item?.kcal ?? item?.calories ?? 0) || 0,
  externalId: item?.externalId ?? undefined,
  macros: {
    protein: Number(item?.macros?.protein ?? item?.protein ?? 0) || 0,
    carbs: Number(item?.macros?.carbs ?? item?.carbs ?? 0) || 0,
    fat: Number(item?.macros?.fat ?? item?.fat ?? 0) || 0,
    fiber: Number(item?.macros?.fiber ?? item?.fiber ?? 0) || 0,
    sugar: Number(item?.macros?.sugar ?? item?.sugar ?? 0) || 0,
    sodium: Number(item?.macros?.sodium ?? item?.sodium ?? 0) || 0,
  },
  protein: Number(item?.protein ?? item?.macros?.protein ?? 0) || 0,
  carbs: Number(item?.carbs ?? item?.macros?.carbs ?? 0) || 0,
  fat: Number(item?.fat ?? item?.macros?.fat ?? 0) || 0,
  fiber: Number(item?.fiber ?? item?.macros?.fiber ?? 0) || 0,
  sugar: Number(item?.sugar ?? item?.macros?.sugar ?? 0) || 0,
  sodium: Number(item?.sodium ?? item?.macros?.sodium ?? 0) || 0,
  ingredients: Array.isArray(item?.ingredients) ? item.ingredients : [],
  allergens: Array.isArray(item?.allergens) ? item.allergens : [],
  barcode: item?.barcode ?? undefined,
  imageUrl: item?.imageUrl ?? undefined,
  source: item?.source ?? "UPC_API",
});

const getFoodProtein = (food: Food | null | undefined) => {
  const v = Number(food?.macros?.protein ?? food?.protein ?? 0);
  return Number.isFinite(v) ? v : 0;
};

const getFoodCarbs = (food: Food | null | undefined) => {
  const v = Number(food?.macros?.carbs ?? food?.carbs ?? 0);
  return Number.isFinite(v) ? v : 0;
};

const getFoodFat = (food: Food | null | undefined) => {
  const v = Number(food?.macros?.fat ?? food?.fat ?? 0);
  return Number.isFinite(v) ? v : 0;
};

const getFoodIngredients = (food: Food | null | undefined): string[] => {
  return Array.isArray(food?.ingredients) ? food.ingredients : [];
};

const getFoodAllergens = (food: Food | null | undefined): string[] => {
  return Array.isArray(food?.allergens) ? food.allergens : [];
};

const getFoodKcal = (food: Food | null | undefined) => {
  const v = Number(food?.kcal ?? food?.calories ?? food?.energyKcal ?? 0);
  return Number.isFinite(v) ? v : 0;
};

const getFoodKcalForQty = (food: Food | null | undefined, qty: number) => {
  return getFoodKcal(food) * qty;
};
const getMealAnalysisTags = (items: MealItem[]) => {
  return Array.from(
    new Set(
      items.flatMap((item) => {
        const food = item.food;
        return [
          food.name,
          ...(food.brand ? [food.brand] : []),
          ...getFoodIngredients(food),
          ...getFoodAllergens(food),
        ]
          .map((value) => String(value).toLowerCase().trim())
          .filter(Boolean);
      })
    )
  );
};

const extractAnalysisMessages = (analysis: any): string[] => {
  if (!analysis) return [];

  const directMessages = [
    ...(Array.isArray(analysis?.allergenWarnings) ? analysis.allergenWarnings : []),
    ...(Array.isArray(analysis?.dietaryConflicts) ? analysis.dietaryConflicts : []),
    ...(Array.isArray(analysis?.warnings) ? analysis.warnings : []),
    ...(Array.isArray(analysis?.conflicts) ? analysis.conflicts : []),
    ...(Array.isArray(analysis?.messages) ? analysis.messages : []),
  ];

  const normalized = directMessages
    .map((message) => String(message).trim())
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

export default function AddSearch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [weightInput, setWeightInput] = useState("");
  const [weightUnit, setWeightUnit] = useState<"g" | "oz" | "lb">("g");
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);

  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [mealType, setMealType] = useState<MealTypeValue>("breakfast");
  const [allergenAnalysis, setAllergenAnalysis] = useState<any>(null);

  const searchFoods = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFoods([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/foods?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) {
        const msg = await response.text().catch(() => "");
        throw new Error(msg || "Failed to search foods");
      }

      const data = await response.json();
      const normalizedFoods: Food[] = Array.isArray(data)
        ? data.map((item: any) => normalizeFood(item))
        : [];
      setFoods(normalizedFoods);
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

  const getServingText = (food: Food) => {
    const kcal = Math.round(getFoodKcal(food));
    if (kcal <= 0) return "Calories vary by serving";
    const hasServing = food.servingSize && Number(food.servingSize) > 0;
    return hasServing
      ? `${kcal} kcal per serving (${food.servingSize}${food.servingUnit ?? "g"})`
      : `${kcal} kcal per 100g — use weight field below`;
  };

  const getParsedQty = (): number => {
    const w = parseFloat(weightInput);
    if (w > 0 && selectedFood) {
      const grams = weightUnit === "g" ? w : weightUnit === "oz" ? w * 28.3495 : w * 453.592;
      const servingSize = Number(selectedFood.servingSize);
      return servingSize > 0 ? grams / servingSize : grams / 100;
    }
    return parseFloat(String(quantity).replace(/[^\d.]/g, "")) || 1;
  };

  const selectedQty = useMemo(() => getParsedQty(), [quantity, weightInput, weightUnit, selectedFood]);

  const handleSaveFood = async (food: Food) => {
    try {
      const result = await saveFood({
        foodId: food.id,
        id: food.id,
        externalId: food.externalId ?? null,
        barcode: food.barcode ?? null,
        name: food.name,
        brand: food.brand ?? null,
        kcal: getFoodKcal(food),
        protein: getFoodProtein(food),
        carbs: getFoodCarbs(food),
        fat: getFoodFat(food),
        ingredients: getFoodIngredients(food),
        allergens: getFoodAllergens(food),
        servingQty: food.servingQty ?? null,
        servingUnit: food.servingUnit ?? null,
        imageUrl: food.imageUrl ?? null,
        source: food.source ?? "UPC_API",
      });
      if (!result) {
        Alert.alert("Login required", "Please log in to save foods 🔒");
        return;
      }
      Alert.alert("Saved", `${food.name} saved`);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save");
    }
  };

  const handleFoodSelect = async (food: Food) => {
    setSelectedFood(food);
    setQuantity("1");
    const foodTags = [
      food.name.toLowerCase(),
      ...(food.brand ? [food.brand.toLowerCase()] : []),
      ...getFoodIngredients(food).map((i) => String(i).toLowerCase()),
      ...getFoodAllergens(food).map((a) => String(a).toLowerCase()),
    ];
    const macros = { kcal: getFoodKcal(food), protein: getFoodProtein(food), carbs: getFoodCarbs(food), fat: getFoodFat(food) };
    const analysis = await analyzeFood(foodTags, undefined, macros);
    setAllergenAnalysis(analysis);
    setQuantityModalVisible(true);
  };

  const closeQuantityModal = () => {
    Keyboard.dismiss();
    setQuantityModalVisible(false);
    setSelectedFood(null);
    setQuantity("1");
    setWeightInput("");
    setWeightUnit("g");
    setAllergenAnalysis(null);
  };

  const handleAddToMeal = () => {
    if (!selectedFood) return;

    const qty = getParsedQty();
    const foodName = selectedFood.name;
    const analysisMessages = extractAnalysisMessages(allergenAnalysis);

    setMealItems((prev) => [...prev, { food: selectedFood, qty }]);
    closeQuantityModal();

    if (analysisMessages.length > 0) {
      Alert.alert(
        "Food Alert",
        analysisMessages.join("\n"),
        [
          {
            text: "OK",
          },
        ]
      );
      return;
    }

    Alert.alert("Added!", `${foodName} added to your meal.`);
  };

  const handleRemoveItem = (index: number) => {
    setMealItems((prev) => prev.filter((_, i) => i !== index));
  };
  const showMealSavedSuccess = () => {
    Alert.alert("Success!", "Your meal has been saved.", [
      {
        text: "OK",
        onPress: () => {
          setMealItems([]);
          router.push("/(tabs)/Dashboard");
        },
      },
    ]);
  };

  const handleBackToAddMeal = () => {
    router.replace("/(tabs)/AddMeal");
  };

  const mealTypeToApi = (t: MealTypeValue) => {
    const map: Record<MealTypeValue, string> = {
      breakfast: "BREAKFAST",
      lunch: "LUNCH",
      dinner: "DINNER",
      snack: "SNACK",
    };
    return map[t] ?? "BREAKFAST";
  };
 
  const handleSaveMeal = async () => {
    if (mealItems.length === 0) {
      Alert.alert("Empty Meal", "Please add at least one food item to your meal.");
      return;
    }

    try {
      const rawToken = await auth.getToken();
      const token = rawToken?.replace(/^Bearer\s+/i, "");

      if (!token) {
        Alert.alert("Not Authenticated", "Please log in to save meals.");
        router.replace("/");
        return;
      }

      const payload = {
        occurred_at: new Date().toISOString(),
        meal_type: mealTypeToApi(mealType),
        items: mealItems.map((item) => ({
          food_id: item.food.source === "FDC_API" ? null : item.food.id ?? null,
          externalId: item.food.externalId ?? null,
          name: item.food.name,
          brand: item.food.brand ?? null,
          source: item.food.source ?? "UPC_API",
          servingQty: item.food.servingQty ?? 1,
          servingUnit: item.food.servingUnit ?? "serving",
          kcal: Math.round(getFoodKcalForQty(item.food, item.qty)),
          protein: getFoodProtein(item.food) || 0,
          carbs: getFoodCarbs(item.food) || 0,
          fat: getFoodFat(item.food) || 0,
          ingredients: getFoodIngredients(item.food),
          allergens: getFoodAllergens(item.food),
          qty: item.qty,
        })),
      };

      const total = Math.round(getTotalCalories());
      if (total <= 0) {
        Alert.alert("Missing calories", "This food has no calorie info from the source.");
      }

      console.log("[SaveMeal] payload =", JSON.stringify(payload, null, 2));
      const response = await fetch(`${API_BASE}/meals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log("[SaveMeal] status =", response.status);
      console.log("[SaveMeal] response =", text);

      if (response.status === 401) {
        Alert.alert("Session expired", "Please log in again.");
        router.replace("/");
        return;
      }

      if (!response.ok) {
        throw new Error(text || "Failed to save meal");
      }

      const mealMacros = {
        kcal: mealItems.reduce((s, i) => s + getFoodKcalForQty(i.food, i.qty), 0),
        protein: mealItems.reduce((s, i) => s + getFoodProtein(i.food) * i.qty, 0),
        carbs: mealItems.reduce((s, i) => s + getFoodCarbs(i.food) * i.qty, 0),
        fat: mealItems.reduce((s, i) => s + getFoodFat(i.food) * i.qty, 0),
      };
      const mealAnalysis: any = await analyzeFood(getMealAnalysisTags(mealItems), undefined, mealMacros);
      const warningMessages = extractAnalysisMessages(mealAnalysis);

      if (
        mealAnalysis?.hasAllergenWarning ||
        mealAnalysis?.hasDietaryConflict ||
        warningMessages.length > 0
      ) {
        Alert.alert(
          "Meal Alert",
          warningMessages.length > 0
            ? warningMessages.join("\n")
            : "This meal may contain ingredients that could trigger your saved allergies, intolerances, or dietary restrictions.",
          [
            {
              text: "OK",
              onPress: showMealSavedSuccess,
            },
          ]
        );
        return;
      }

      showMealSavedSuccess();
    } catch (error: any) {
      console.error("Save meal error:", error);
      Alert.alert("Error", error?.message || "Failed to save meal. Please try again.");
    }
  };
  const getTotalCalories = () => {
    return mealItems.reduce((sum, item) => sum + getFoodKcalForQty(item.food, item.qty), 0);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <View style={styles.searchHeader}>
        <View style={styles.searchHeaderRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToAddMeal}>
            <FontAwesome name="arrow-left" size={18} color={Colors.neutral.textDark} />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <FontAwesome
              name="search"
              size={18}
              color={Colors.neutral.mutedGray}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for foods..."
              placeholderTextColor={Colors.neutral.mutedGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              inputAccessoryViewID={KEYBOARD_DISMISS_ACCESSORY_ID}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <FontAwesome
                  name="times-circle"
                  size={18}
                  color={Colors.neutral.mutedGray}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 8 }}>
        {([
          ["breakfast", "BREAKFAST"],
          ["lunch", "LUNCH"],
          ["dinner", "DINNER"],
          ["snack", "SNACK"],
        ] as const).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            onPress={() => setMealType(value)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: mealType === value ? Colors.primary.green : "#E0E0E0",
              backgroundColor: mealType === value ? `${Colors.primary.green}15` : "white",
            }}
          >
            <Text style={{ fontWeight: "700" }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mealItems.length > 0 && (
        <View style={styles.mealSummary}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)} • {mealItems.length} item
              {mealItems.length > 1 ? "s" : ""} • {Math.round(getTotalCalories())} kcal
            </Text>
            <TouchableOpacity onPress={handleSaveMeal} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save Meal</Text>
            </TouchableOpacity>
          </View>

          <MealTypeSelector value={mealType} onChange={setMealType} style={styles.mealTypeSelector} />
        </View>
      )}

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
            String(food?.id ?? food?.externalId ?? `${food?.name ?? "food"}-${food?.brand ?? ""}`) +
            "-" +
            idx;

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
                  {servingUnit && Number.isFinite(servingQty) && servingQty > 0 ? (
                    <Text style={styles.foodServing}>{servingQty} {servingUnit}</Text>
                  ) : (
                    <Text style={styles.foodServing}>per 100g</Text>
                  )}
                  <Text style={styles.foodMacros}>
                    P {Math.round(getFoodProtein(food))}g • C {Math.round(getFoodCarbs(food))}g • F {Math.round(getFoodFat(food))}g
                  </Text>
                </View>

                {kcalVal > 0 && (
                  <View style={styles.calorieBadge}>
                    <Text style={styles.calorieText}>{Math.round(kcalVal)}</Text>
                    <Text style={styles.calorieUnit}>kcal</Text>
                  </View>
                )}
              </View>

              <View style={styles.foodActions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSaveFood(food);
                  }}
                >
                  <FontAwesome name="bookmark" size={22} color={Colors.primary.orange} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
        visible={quantityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeQuantityModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeQuantityModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedFood && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderRow}>
                    <View style={styles.modalHeaderText}>
                      <Text style={styles.modalTitle}>{selectedFood.name}</Text>
                      {selectedFood.brand && (
                        <Text style={styles.modalBrand}>{selectedFood.brand}</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.keyboardDismissButton}
                      onPress={closeQuantityModal}
                    >
                      <FontAwesome name="times" size={16} color={Colors.neutral.textDark} />
                    </TouchableOpacity>
                  </View>
                </View>

                {allergenAnalysis &&
                  (allergenAnalysis.hasAllergenWarning ||
                    allergenAnalysis.hasDietaryConflict) && (
                    <AllergenWarning analysis={allergenAnalysis} variant="compact" />
                  )}

                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Servings</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={(t) => { setQuantity(t); setWeightInput(""); }}
                    inputAccessoryViewID={KEYBOARD_DISMISS_ACCESSORY_ID}
                    keyboardType="numbers-and-punctuation"
                    placeholder="1"
                  />
                  <Text style={styles.quantityUnit}>{getServingText(selectedFood)}</Text>
                </View>

                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Or enter by weight</Text>
                  <View style={styles.weightRow}>
                    <TextInput
                      style={[styles.quantityInput, { flex: 1 }]}
                      value={weightInput}
                      onChangeText={(t) => { setWeightInput(t); setQuantity("1"); }}
                      inputAccessoryViewID={KEYBOARD_DISMISS_ACCESSORY_ID}
                      keyboardType="numbers-and-punctuation"
                      placeholder="e.g. 150"
                    />
                    <View style={styles.weightUnitRow}>
                      {(["g", "oz", "lb"] as const).map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[styles.unitBtn, weightUnit === u && styles.unitBtnActive]}
                          onPress={() => setWeightUnit(u)}
                        >
                          <Text style={[styles.unitBtnText, weightUnit === u && styles.unitBtnTextActive]}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {selectedFood && (
                  <View style={styles.caloriePreview}>
                    <Text style={styles.caloriePreviewText}>
                      {Math.round(getFoodKcalForQty(selectedFood, getParsedQty()))} kcal
                    </Text>
                    <Text style={styles.macroPreviewText}>
                      P {Math.round(getFoodProtein(selectedFood) * getParsedQty())}g • C {Math.round(getFoodCarbs(selectedFood) * getParsedQty())}g • F {Math.round(getFoodFat(selectedFood) * getParsedQty())}g
                    </Text>
                  </View>
                )}


                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeQuantityModal}
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

      <KeyboardDismissAccessory />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.backgroundLight,
  },
  topSafeArea: {
    backgroundColor: "#000000",
  },
  searchHeader: {
    backgroundColor: Colors.neutral.cardSurface,
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutral.backgroundLight,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.backgroundLight,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: Theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.textDark,
  },
  mealSummary: {
    backgroundColor: Colors.primary.green,
    padding: Theme.spacing.md,
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
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.xl,
  },
  saveButtonText: {
    color: Colors.primary.green,
    fontSize: 14,
    fontWeight: "700",
  },
  mealTypeSelector: {
    marginTop: Theme.spacing.md,
  },
  mealItemsPreview: {
    maxHeight: 60,
    backgroundColor: Colors.neutral.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  mealItemsContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  mealItemChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.backgroundLight,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    marginRight: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: Theme.spacing.sm,
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
    padding: Theme.spacing.lg,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: Theme.spacing.lg,
    fontSize: 14,
    color: Colors.neutral.mutedGray,
  },
  emptyText: {
    marginTop: Theme.spacing.lg,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.neutral.textDark,
  },
  emptySubtext: {
    marginTop: Theme.spacing.sm,
    fontSize: 14,
    color: Colors.neutral.mutedGray,
  },
  foodCard: {
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
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
    marginRight: Theme.spacing.md,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginBottom: Theme.spacing.xs,
  },
  foodBrand: {
    fontSize: 13,
    color: Colors.neutral.mutedGray,
    marginBottom: Theme.spacing.xs,
  },
  foodServing: {
    fontSize: 12,
    color: Colors.neutral.mutedGray,
  },
  foodMacros: {
    fontSize: 12,
    color: Colors.neutral.mutedGray,
    marginTop: 4,
  },
  calorieBadge: {
    alignItems: "center",
    backgroundColor: `${Colors.primary.green}15`,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    marginLeft: Theme.spacing.md,
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
  foodActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: Theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.neutral.cardSurface,
    borderTopLeftRadius: Theme.radius["2xl"],
    borderTopRightRadius: Theme.radius["2xl"],
    padding: Theme.spacing["2xl"],
    minHeight: "65%",
    maxHeight: "94%",
  },
  modalHeader: {
    marginBottom: Theme.spacing.xl,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Theme.spacing.md,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    marginBottom: Theme.spacing.xs,
  },
  modalBrand: {
    fontSize: 14,
    color: Colors.neutral.mutedGray,
  },
  keyboardDismissButton: {
    width: 32,
    height: 32,
    borderRadius: Theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutral.backgroundLight,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weightUnitRow: {
    flexDirection: "row",
    gap: 6,
  },
  unitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: Colors.neutral.backgroundLight,
  },
  unitBtnActive: {
    borderColor: Colors.primary.green,
    backgroundColor: `${Colors.primary.green}15`,
  },
  unitBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.neutral.mutedGray,
  },
  unitBtnTextActive: {
    color: Colors.primary.green,
  },
  quantityContainer: {
    marginBottom: Theme.spacing.xl,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    marginBottom: Theme.spacing.sm,
  },
  quantityInput: {
    backgroundColor: Colors.neutral.backgroundLight,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.neutral.textDark,
  },
  quantityUnit: {
    marginTop: Theme.spacing.sm,
    fontSize: 13,
    color: Colors.neutral.mutedGray,
  },
  caloriePreview: {
    backgroundColor: `${Colors.primary.green}10`,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  caloriePreviewText: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary.green,
  },
  macroPreviewText: {
    marginTop: Theme.spacing.sm,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutral.textDark,
  },
  modalActions: {
    flexDirection: "row",
    gap: Theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
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