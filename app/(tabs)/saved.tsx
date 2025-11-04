import { API_BASE } from "@/app/constants/api";
import { auth } from "@/app/lib/auth";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
}

const SAVED_FOODS_KEY = "saved_foods";

export default function AddSaved() {
  const router = useRouter();
  const [savedFoods, setSavedFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSavedFoods();
  }, []);

  const loadSavedFoods = async () => {
    setLoading(true);
    try {
      // Load from local storage
      const saved = await AsyncStorage.getItem(SAVED_FOODS_KEY);
      if (saved) {
        const foods = JSON.parse(saved);
        setSavedFoods(foods);
      } else {
        // If no saved foods, try to get from recent meals
        await loadFromRecentMeals();
      }
    } catch (error) {
      console.error("Failed to load saved foods:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFromRecentMeals = async () => {
    try {
      const token = await auth.getToken();
      if (!token) return;

      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`${API_BASE}/meals?date=${today}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const meals = await response.json();
        // Extract unique foods from recent meals
        const foodsMap = new Map<string, Food>();
        meals.forEach((meal: any) => {
          meal.items.forEach((item: any) => {
            if (!foodsMap.has(item.food.id)) {
              foodsMap.set(item.food.id, item.food);
            }
          });
        });
        const foods = Array.from(foodsMap.values());
        setSavedFoods(foods);
        // Save to local storage
        await AsyncStorage.setItem(SAVED_FOODS_KEY, JSON.stringify(foods));
      }
    } catch (error) {
      console.error("Failed to load from recent meals:", error);
    }
  };

  const handleAddFood = (food: Food) => {
    Alert.alert(
      "Add to Meal",
      `Would you like to add "${food.name}" to your meal?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: () => {
            // Navigate to search screen with this food pre-selected
            // For now, just show an alert
            Alert.alert("Added!", `Adding ${food.name} to meal...`);
            // TODO: Navigate to meal builder or add directly
          },
        },
      ]
    );
  };

  const filteredFoods = savedFoods.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (food.brand && food.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.green} />
        <Text style={styles.loadingText}>Loading saved foods...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={18} color={Colors.neutral.mutedGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search saved foods..."
            placeholderTextColor={Colors.neutral.mutedGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome name="times-circle" size={18} color={Colors.neutral.mutedGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {savedFoods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="bookmark-o" size={64} color={Colors.neutral.mutedGray} />
            <Text style={styles.emptyTitle}>No Saved Foods Yet</Text>
            <Text style={styles.emptyText}>
              Your frequently used foods will appear here. Start by adding meals!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/search")}
            >
              <Text style={styles.emptyButtonText}>Search Foods</Text>
            </TouchableOpacity>
          </View>
        ) : filteredFoods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="search" size={64} color={Colors.neutral.mutedGray} />
            <Text style={styles.emptyTitle}>No Results</Text>
            <Text style={styles.emptyText}>
              No saved foods match your search. Try a different term.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Saved Foods</Text>
              <Text style={styles.headerSubtitle}>
                {filteredFoods.length} food{filteredFoods.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {filteredFoods.map((food) => (
              <TouchableOpacity
                key={food.id}
                style={styles.foodCard}
                onPress={() => handleAddFood(food)}
                activeOpacity={0.7}
              >
                <View style={styles.foodIcon}>
                  <FontAwesome name="cutlery" size={20} color={Colors.primary.orange} />
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  {food.brand && (
                    <Text style={styles.foodBrand}>{food.brand}</Text>
                  )}
                  {food.servingUnit && (
                    <Text style={styles.foodServing}>
                      {food.servingQty || 1} {food.servingUnit}
                    </Text>
                  )}
                </View>
                {food.kcal && (
                  <View style={styles.calorieBadge}>
                    <Text style={styles.calorieText}>{Math.round(food.kcal)}</Text>
                    <Text style={styles.calorieUnit}>kcal</Text>
                  </View>
                )}
                <FontAwesome name="plus-circle" size={24} color={Colors.primary.green} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutral.backgroundLight,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.neutral.mutedGray,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    marginBottom: 4,
  },
  headerSubtitle: {
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
  foodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${Colors.primary.orange}15`,
    alignItems: "center",
    justifyContent: "center",
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
    marginRight: 12,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.neutral.mutedGray,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
