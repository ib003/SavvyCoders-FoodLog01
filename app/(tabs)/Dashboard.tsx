import AllergenWarning from "@/components/AllergenWarning";
import NutritionInsights from "@/components/NutritionInsights";
import { Card } from "@/components/ui/Card";
import { Theme } from "@/constants/Theme";
import { API_BASE } from "@/src/constants/api";
import { analyzeFood } from "@/src/lib/allergenChecker";
import { auth } from "@/src/lib/auth";
import { preferences } from "@/src/lib/preferences";
import { Symptom, symptoms } from "@/src/lib/symptoms";
import { useFadeIn, useStagger } from "@/src/ui/animations";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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

  // Animations - use max count to avoid re-renders
  const emptyStateOpacity = useFadeIn(400, 200);
  const maxMeals = 10; // Max expected meals for animation
  const maxAlerts = 10; // Max expected alerts for animation
  const mealAnimations = useStagger(maxMeals, 300, 80);
  const alertAnimations = useStagger(maxAlerts, 300, 80);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const token = await auth.getToken();
      if (!token || typeof token !== "string" || token.length < 20) {
        console.log("[Dashboard] No valid token, redirecting to login");
        router.replace("/");
        return;
      }
      loadDashboardData();
    };
    checkAuthAndLoad();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodaySymptoms();
    }, []),
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
      const foodNames = meal.items.map((item) => item.food.name);
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
        <ActivityIndicator size="large" color={Theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[
          Theme.colors.background.gradient[0],
          Theme.colors.background.gradient[1],
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good{" "}
              {new Date().getHours() < 12
                ? "Morning"
                : new Date().getHours() < 18
                  ? "Afternoon"
                  : "Evening"}
              !
            </Text>
            <Text style={styles.date}>{getTodayDate()}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/(tabs)/Profile")}
          >
            <View style={styles.profileIconContainer}>
              <FontAwesome
                name="user-circle"
                size={28}
                color={Theme.colors.primary.main}
              />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/AddMeal")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  Theme.colors.primary.gradient[0],
                  Theme.colors.primary.gradient[1],
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIconContainer}
              >
                <FontAwesome name="plus-circle" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionButtonText}>Add Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/AllergiesPreferences")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${Theme.colors.accent.orange}20` },
                ]}
              >
                <FontAwesome
                  name="exclamation-triangle"
                  size={24}
                  color={Theme.colors.accent.orange}
                />
              </View>
              <Text style={styles.actionButtonText}>Allergies</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/chart-demo" as any)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${Theme.colors.accent.purple}20` },
                ]}
              >
                <FontAwesome
                  name="bar-chart"
                  size={24}
                  color={Theme.colors.accent.purple}
                />
              </View>
              <Text style={styles.actionButtonText}>Charts Demo</Text>
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
            {alerts.map((alert, index) => {
              const anim =
                alertAnimations[Math.min(index, alertAnimations.length - 1)];
              return (
                <Animated.View
                  key={index}
                  style={{
                    opacity: anim.opacity,
                    transform: [{ translateY: anim.translateY }],
                  }}
                >
                  <Card
                    style={styles.alertCard}
                    padding="lg"
                    variant="elevated"
                  >
                    <View style={styles.alertMealHeader}>
                      <FontAwesome
                        name={getMealTypeIcon(alert.meal.mealType) as any}
                        size={16}
                        color={Theme.colors.accent.orange}
                      />
                      <Text style={styles.alertMealType}>
                        {getMealTypeLabel(alert.meal.mealType)} •{" "}
                        {formatTime(alert.meal.occurredAt)}
                      </Text>
                    </View>
                    <Text style={styles.alertMealItems} numberOfLines={2}>
                      {alert.meal.items
                        .map((item) => item.food.name)
                        .join(", ")}
                    </Text>
                    <View style={styles.alertWarningContainer}>
                      <AllergenWarning
                        analysis={alert.analysis}
                        variant="banner"
                      />
                    </View>
                  </Card>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Today's Meals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome
              name="cutlery"
              size={20}
              color={Theme.colors.primary.main}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{todayMeals.length}</Text>
            </View>
          </View>

          {todayMeals.length === 0 ? (
            <Animated.View style={{ opacity: emptyStateOpacity }}>
              <Card style={styles.emptyCard} padding="2xl" variant="outlined">
                <FontAwesome
                  name="cutlery"
                  size={48}
                  color={Theme.colors.text.tertiary}
                />
                <Text style={styles.emptyText}>No meals logged today</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push("/(tabs)/AddMeal")}
                >
                  <Text style={styles.emptyButtonText}>
                    Add Your First Meal
                  </Text>
                </TouchableOpacity>
              </Card>
            </Animated.View>
          ) : (
            todayMeals.map((meal, index) => {
              const anim =
                mealAnimations[Math.min(index, mealAnimations.length - 1)];
              return (
                <Animated.View
                  key={meal.id}
                  style={{
                    opacity: anim.opacity,
                    transform: [{ translateY: anim.translateY }],
                  }}
                >
                  <Card style={styles.mealCard} padding="lg" variant="elevated">
                    <View style={styles.mealHeader}>
                      <View style={styles.mealTypeContainer}>
                        <FontAwesome
                          name={getMealTypeIcon(meal.mealType)}
                          size={18}
                          color={Theme.colors.primary.main}
                          style={styles.mealIcon}
                        />
                        <Text style={styles.mealType}>
                          {getMealTypeLabel(meal.mealType)}
                        </Text>
                      </View>
                      <Text style={styles.mealTime}>
                        {formatTime(meal.occurredAt)}
                      </Text>
                    </View>

                    <View style={styles.mealItems}>
                      {meal.items.map((item, index) => (
                        <View
                          key={item.food.id}
                          style={[
                            styles.mealItem,
                            index < meal.items.length - 1 &&
                              styles.mealItemBorder,
                          ]}
                        >
                          <Text style={styles.mealItemName}>
                            {item.food.name}
                          </Text>
                          {item.food.kcal && (
                            <Text style={styles.mealItemKcal}>
                              {item.food.kcal} kcal
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </Card>
                </Animated.View>
              );
            })
          )}
        </View>

        {/* Symptoms Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome
              name="heartbeat"
              size={20}
              color={Theme.colors.accent.orange}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Today's Symptoms</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{todaySymptoms.length}</Text>
            </View>
          </View>

          {todaySymptoms.length === 0 ? (
            <Card style={styles.emptyCard} padding="2xl" variant="outlined">
              <FontAwesome
                name="smile-o"
                size={48}
                color={Theme.colors.text.tertiary}
              />
              <Text style={styles.emptyText}>No symptoms logged</Text>
              <Text style={styles.emptySubtext}>Tap to add symptoms</Text>
            </Card>
          ) : (
            <View style={styles.symptomsContainer}>
              {todaySymptoms.map((symptom) => (
                <View key={symptom.id} style={styles.symptomChip}>
                  <Text style={styles.symptomName}>{symptom.name}</Text>
                  <View
                    style={[
                      styles.severityBadge,
                      symptom.severity === "severe" && styles.severitySevere,
                      symptom.severity === "moderate" &&
                        styles.severityModerate,
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
                    <FontAwesome
                      name="times"
                      size={12}
                      color={Theme.colors.text.tertiary}
                    />
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
            <FontAwesome
              name="plus"
              size={16}
              color={Theme.colors.primary.main}
              style={styles.addIcon}
            />
            <Text style={styles.addSymptomText}>Add Symptom</Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition Insights */}
        <NutritionInsights />

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard} padding="lg" variant="elevated">
            <Text style={styles.statValue}>{todayMeals.length}</Text>
            <Text style={styles.statLabel}>Meals</Text>
          </Card>
          <Card style={styles.statCard} padding="lg" variant="elevated">
            <Text style={styles.statValue}>{todaySymptoms.length}</Text>
            <Text style={styles.statLabel}>Symptoms</Text>
          </Card>
          <Card style={styles.statCard} padding="lg" variant="elevated">
            <Text style={styles.statValue}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.background.secondary,
  },
  loadingText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.md,
  },
  headerGradient: {
    paddingTop: Theme.spacing["5xl"],
    paddingBottom: Theme.spacing["2xl"],
    paddingHorizontal: Theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    ...Theme.typography.title,
    fontSize: 28,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  date: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
    fontWeight: "500",
  },
  profileButton: {
    padding: Theme.spacing.xs,
  },
  profileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.card,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing["3xl"],
  },
  section: {
    marginBottom: Theme.spacing["2xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  sectionIcon: {
    marginRight: Theme.spacing.sm,
  },
  sectionTitle: {
    ...Theme.typography.sectionTitle,
    flex: 1,
  },
  countBadge: {
    backgroundColor: `${Theme.colors.primary.main}15`,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
  },
  countText: {
    ...Theme.typography.bodySmall,
    fontWeight: "600",
    color: Theme.colors.primary.main,
  },
  // Quick Actions
  actionsRow: {
    flexDirection: "row",
    gap: Theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    padding: Theme.spacing.xl,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: Theme.radius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.button,
  },
  actionButtonText: {
    ...Theme.typography.bodySmall,
    fontWeight: "600",
    color: Theme.colors.text.primary,
  },
  // Alerts
  alertCard: {
    marginBottom: Theme.spacing.md,
  },
  alertMealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  alertMealType: {
    ...Theme.typography.bodySmall,
    fontWeight: "700",
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },
  alertMealItems: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
    lineHeight: 20,
  },
  alertWarningContainer: {
    marginTop: Theme.spacing.xs,
  },
  alertCountBadge: {
    backgroundColor: Theme.colors.accent.orange,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    minWidth: 28,
    alignItems: "center",
  },
  alertCountText: {
    ...Theme.typography.captionSmall,
    fontWeight: "700",
    color: Theme.colors.text.inverse,
  },
  // Meals
  mealCard: {
    marginBottom: Theme.spacing.md,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  mealTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealIcon: {
    marginRight: Theme.spacing.sm,
  },
  mealType: {
    ...Theme.typography.body,
    fontWeight: "700",
    color: Theme.colors.text.primary,
  },
  mealTime: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
    fontWeight: "500",
  },
  mealItems: {
    gap: Theme.spacing.xs,
  },
  mealItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Theme.spacing.sm,
  },
  mealItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  mealItemName: {
    ...Theme.typography.body,
    fontWeight: "500",
    color: Theme.colors.text.primary,
    flex: 1,
  },
  mealItemKcal: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
    fontWeight: "600",
  },
  // Symptoms
  symptomsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  symptomChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.background.primary,
    borderRadius: Theme.radius.xl,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  symptomName: {
    ...Theme.typography.bodySmall,
    fontWeight: "600",
    color: Theme.colors.text.primary,
    marginRight: Theme.spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.sm,
  },
  severityMild: {
    backgroundColor: `${Theme.colors.accent.yellow}30`,
  },
  severityModerate: {
    backgroundColor: `${Theme.colors.accent.orange}30`,
  },
  severitySevere: {
    backgroundColor: `${Theme.colors.accent.orange}50`,
  },
  severityText: {
    ...Theme.typography.captionSmall,
    fontWeight: "700",
    color: Theme.colors.text.primary,
    textTransform: "uppercase",
  },
  addSymptomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.background.primary,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    borderWidth: 2,
    borderColor: Theme.colors.primary.main,
    borderStyle: "dashed",
  },
  addIcon: {
    marginRight: Theme.spacing.sm,
  },
  addSymptomText: {
    ...Theme.typography.bodySmall,
    fontWeight: "600",
    color: Theme.colors.primary.main,
  },
  removeSymptomButton: {
    marginLeft: Theme.spacing.sm,
    padding: Theme.spacing.xs,
  },
  // Empty States
  emptyCard: {
    alignItems: "center",
  },
  emptyText: {
    ...Theme.typography.body,
    fontWeight: "600",
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  emptySubtext: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
  },
  emptyButton: {
    marginTop: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary.main,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    ...Theme.shadows.button,
  },
  emptyButtonText: {
    ...Theme.typography.button,
    color: Theme.colors.text.inverse,
  },
  // Stats
  statsContainer: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...Theme.typography.title,
    fontSize: 36,
    color: Theme.colors.primary.main,
    marginBottom: Theme.spacing.xs,
  },
  statLabel: {
    ...Theme.typography.captionSmall,
    fontWeight: "600",
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
