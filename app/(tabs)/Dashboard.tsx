import { API_BASE } from "@/app/constants/api";
import { analyzeFood } from "@/app/lib/allergenChecker";
import { auth } from "@/app/lib/auth";
import { preferences } from "@/app/lib/preferences";
import { Symptom, symptoms } from "@/app/lib/symptoms";
import AllergenWarning from "@/components/AllergenWarning";
import NutritionInsights from "@/components/NutritionInsights";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Meal {
  id: string;
  mealType: string;
  occurredAt: string;
  items: Array<{
    food: {
      id: string;
      name: string;
      brand?: string;
      kcal?: number;
    };
    qty: number;
  }>;
}

interface AlertItem {
  meal: Meal;
  analysis: {
    hasAllergenWarning: boolean;
    allergenMatches: string[];
    hasDietaryConflict: boolean;
    dietaryMatches: string[];
    dietaryConflicts: string[];
    warnings: string[];
  };
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [todaySymptoms, setTodaySymptoms] = useState<Symptom[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  //check authentication on mount
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const isAuth = await auth.isAuthenticated();
      if (!isAuth) {
        router.replace("/");
        return;
      }
      loadDashboardData();
    };
    checkAuthAndLoad();
  }, []);

  //refresh symptoms when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTodaySymptoms();
    }, [])
  );

  const loadDashboardData = async () => {
    setLoading(true);
    await Promise.all([loadTodayMeals(), loadTodaySymptoms()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const loadTodayMeals = async () => {
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
        setTodayMeals(meals);
        await checkAlerts(meals);
      }
    } catch (error) {
      console.error("Failed to load meals:", error);
    }
  };

  const checkAlerts = async (meals: Meal[]) => {
    const userPrefs = await preferences.fetch();
    const alertsList: AlertItem[] = [];

    for (const meal of meals) {
      //collect all food tags/names for this meal
      const foodNames = meal.items.map(item => item.food.name);
      //for now we use food names as tags - in production you would have actual allergen tags
      const analysis = await analyzeFood(foodNames, userPrefs);
      
      if (analysis.hasAllergenWarning || analysis.hasDietaryConflict) {
        alertsList.push({
          meal,
          analysis,
        });
      }
    }

    setAlerts(alertsList);
  };

  const loadTodaySymptoms = async () => {
    try {
      const symptomsList = await symptoms.getTodaySymptoms();
      setTodaySymptoms(symptomsList);
    } catch (error) {
      console.error("Failed to load symptoms:", error);
    }
  };

  const handleRemoveSymptom = async (symptomId: string) => {
    try {
      await symptoms.removeSymptom(symptomId);
      await loadTodaySymptoms();
    } catch (error) {
      console.error("Failed to remove symptom:", error);
      Alert.alert("Error", "Failed to remove symptom");
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    const type = mealType.toLowerCase();
    if (type.includes("breakfast")) return "coffee";
    if (type.includes("lunch")) return "sun-o";
    if (type.includes("dinner")) return "moon-o";
    if (type.includes("snack")) return "cutlery";
    return "cutlery";
  };

  const getMealTypeLabel = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.green} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}!</Text>
          <Text style={styles.date}>{getTodayDate()}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/(tabs)/Profile")}
        >
          <FontAwesome name="user-circle" size={28} color={Colors.primary.green} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary.green} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { marginRight: 6 }]}
              onPress={() => router.push("/(tabs)/AddMeal")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: `${Colors.primary.green}15` }]}>
                <FontAwesome name="plus-circle" size={24} color={Colors.primary.green} />
              </View>
              <Text style={styles.actionButtonText}>Add Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { marginLeft: 6 }]}
              onPress={() => router.push("/(tabs)/AllergiesPreferences")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: `${Colors.primary.orange}15` }]}>
                <FontAwesome name="exclamation-triangle" size={24} color={Colors.primary.orange} />
              </View>
              <Text style={styles.actionButtonText}>Allergies</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ Safety Alerts</Text>
              <View style={styles.alertCountBadge}>
                <Text style={styles.alertCountText}>{alerts.length}</Text>
              </View>
            </View>
            {alerts.map((alert, index) => (
              <View key={index} style={styles.alertWrapper}>
                <View style={styles.alertMealInfo}>
                  <View style={styles.alertMealHeader}>
                    <FontAwesome 
                      name={getMealTypeIcon(alert.meal.mealType) as any} 
                      size={16} 
                      color={Colors.primary.orange} 
                    />
                    <Text style={styles.alertMealType}>
                      {getMealTypeLabel(alert.meal.mealType)} • {formatTime(alert.meal.occurredAt)}
                    </Text>
                  </View>
                  <Text style={styles.alertMealItems} numberOfLines={2}>
                    {alert.meal.items.map(item => item.food.name).join(", ")}
                  </Text>
                </View>
                <AllergenWarning 
                  analysis={alert.analysis} 
                  variant="banner"
                />
              </View>
            ))}
          </View>
        )}

        {/* Today's Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="cutlery" size={20} color={Colors.primary.green} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <Text style={styles.mealCount}>{todayMeals.length}</Text>
          </View>

          {todayMeals.length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome name="cutlery" size={32} color={Colors.neutral.mutedGray} />
              <Text style={styles.emptyText}>No meals logged today</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/(tabs)/AddMeal")}
              >
                <Text style={styles.emptyButtonText}>Add Your First Meal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todayMeals.map((meal) => (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealTypeContainer}>
                    <FontAwesome
                      name={getMealTypeIcon(meal.mealType)}
                      size={18}
                      color={Colors.primary.green}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.mealType}>{getMealTypeLabel(meal.mealType)}</Text>
                  </View>
                  <Text style={styles.mealTime}>{formatTime(meal.occurredAt)}</Text>
                </View>

                <View style={styles.mealItems}>
                  {meal.items.map((item, index) => (
                    <View key={item.food.id} style={styles.mealItem}>
                      <Text style={styles.mealItemName}>{item.food.name}</Text>
                      {item.food.kcal && (
                        <Text style={styles.mealItemKcal}>{item.food.kcal} kcal</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Symptoms Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="heartbeat" size={20} color={Colors.primary.orange} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Today's Symptoms</Text>
            <Text style={styles.mealCount}>{todaySymptoms.length}</Text>
          </View>

          {todaySymptoms.length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome name="smile-o" size={32} color={Colors.neutral.mutedGray} />
              <Text style={styles.emptyText}>No symptoms logged</Text>
              <Text style={styles.emptySubtext}>Tap to add symptoms</Text>
            </View>
          ) : (
            <View style={styles.symptomsContainer}>
              {todaySymptoms.map((symptom) => (
                <View key={symptom.id} style={[styles.symptomChip, { marginRight: 8, marginBottom: 8 }]}>
                  <Text style={styles.symptomName}>{symptom.name}</Text>
                  <View
                    style={[
                      styles.severityBadge,
                      symptom.severity === "severe" && styles.severitySevere,
                      symptom.severity === "moderate" && styles.severityModerate,
                      symptom.severity === "mild" && styles.severityMild,
                    ]}
                  >
                    <Text style={styles.severityText}>{symptom.severity}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveSymptom(symptom.id)}
                    style={styles.removeSymptomButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <FontAwesome name="times" size={12} color={Colors.neutral.mutedGray} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.addSymptomButton}
            onPress={() => router.push("/symptom")}
            activeOpacity={0.8}
          >
            <FontAwesome name="plus" size={16} color={Colors.primary.green} style={{ marginRight: 8 }} />
            <Text style={styles.addSymptomText}>Add Symptom</Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition Insights */}
        <NutritionInsights />

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayMeals.length}</Text>
            <Text style={styles.statLabel}>Meals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todaySymptoms.length}</Text>
            <Text style={styles.statLabel}>Symptoms</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral.backgroundLight,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.neutral.mutedGray,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.neutral.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: Colors.neutral.mutedGray,
    fontWeight: "500",
  },
  profileButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    flex: 1,
  },
  mealCount: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary.green,
    backgroundColor: `${Colors.primary.green}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // Quick Actions
  actionsRow: {
    flexDirection: "row",
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutral.textDark,
  },
  // Alerts
  alertWrapper: {
    marginBottom: 16,
  },
  alertMealInfo: {
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  alertMealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  alertMealType: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginLeft: 8,
    flex: 1,
  },
  alertMealItems: {
    fontSize: 13,
    color: Colors.neutral.mutedGray,
    lineHeight: 18,
  },
  alertCountBadge: {
    backgroundColor: Colors.primary.orange,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
  },
  alertCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Meals
  mealCard: {
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mealTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealType: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.neutral.textDark,
  },
  mealTime: {
    fontSize: 14,
    color: Colors.neutral.mutedGray,
    fontWeight: "500",
  },
  mealItems: {
  },
  mealItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  mealItemName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.neutral.textDark,
    flex: 1,
  },
  mealItemKcal: {
    fontSize: 13,
    color: Colors.neutral.mutedGray,
    fontWeight: "600",
  },
  // Symptoms
  symptomsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  symptomChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  symptomName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityMild: {
    backgroundColor: `${Colors.primary.yellow}30`,
  },
  severityModerate: {
    backgroundColor: `${Colors.primary.orange}30`,
  },
  severitySevere: {
    backgroundColor: `${Colors.primary.orange}50`,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    textTransform: "uppercase",
  },
  addSymptomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.primary.green,
    borderStyle: "dashed",
  },
  addSymptomText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary.green,
  },
  removeSymptomButton: {
    marginLeft: 8,
    padding: 4,
  },
  // Empty States
  emptyCard: {
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F0F0F0",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.neutral.mutedGray,
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: Colors.primary.green,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  // Stats
  statsContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.primary.green,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.neutral.mutedGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
