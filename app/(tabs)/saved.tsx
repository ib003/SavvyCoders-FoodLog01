import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
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
import { getSavedFoods, removeSavedFood, SavedFoodRow } from "../../src/_api/savedFoods";

interface Food {
  id: number;
  name: string;
  brand?: string;
  servingUnit?: string;
  servingQty?: number;
  kcal?: number;
}

export default function AddSaved() {
  const router = useRouter();
  const [savedRows, setSavedRows] = useState<SavedFoodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSavedFoods();
  }, []);

  const loadSavedFoods = async () => {
    setLoading(true);
    try {
      const rows = await getSavedFoods();
      setSavedRows(rows);
    } catch (error) {
      console.error("Failed to load saved foods:", error);
      Alert.alert("Error", "Failed to load saved foods");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (savedId: number) => {
    try {
      await removeSavedFood(savedId);
      setSavedRows((prev) => prev.filter((r) => r.id !== savedId));
    } catch (error) {
      Alert.alert("Error", "Failed to remove food");
    }
  };

  const handleAddFood = (food: Food) => {
    Alert.alert("Add to Meal", `Would you like to add "${food.name}" to your meal?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Add",
        onPress: () => {
          Alert.alert("Added!", `Adding ${food.name} to meal...`);
        },
      },
    ]);
  };

  const filteredRows = savedRows.filter((row) => {
    const food = row.food as Food;
    return (
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (food.brand && food.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

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
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <FontAwesome
            name="search"
            size={18}
            color={Colors.neutral.mutedGray}
            style={styles.searchIcon}
          />
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {savedRows.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="bookmark-o" size={64} color={Colors.neutral.mutedGray} />
            <Text style={styles.emptyTitle}>No Saved Foods Yet</Text>
            <Text style={styles.emptyText}>
              Your frequently used foods will appear here. Start by adding meals!
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/search")}>
              <Text style={styles.emptyButtonText}>Search Foods</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRows.length === 0 ? (
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
                {filteredRows.length} food{filteredRows.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {filteredRows.map((row) => {
              const food = row.food as Food;

              return (
                <TouchableOpacity
                  key={row.id}
                  style={styles.foodCard}
                  onPress={() => handleAddFood(food)}
                  activeOpacity={0.7}
                >
                  <View style={styles.foodIcon}>
                    <FontAwesome name="cutlery" size={20} color={Colors.primary.orange} />
                  </View>

                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    {food.brand && <Text style={styles.foodBrand}>{food.brand}</Text>}
                    {food.servingUnit && (
                      <Text style={styles.foodServing}>
                        {food.servingQty || 1} {food.servingUnit}
                      </Text>
                    )}
                  </View>

                  {food.kcal ? (
                    <View style={styles.calorieBadge}>
                      <Text style={styles.calorieText}>{Math.round(food.kcal)}</Text>
                      <Text style={styles.calorieUnit}>kcal</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity onPress={() => handleRemove(row.id)}>
                    <FontAwesome name="trash" size={22} color={Colors.primary.orange} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
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