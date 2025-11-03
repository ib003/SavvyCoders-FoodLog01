import { API_BASE } from "@/app/constants/api";
import { analyzeFood } from "@/app/lib/allergenChecker";
import { auth } from "@/app/lib/auth";
import { preferences } from "@/app/lib/preferences";
import AllergenWarning from "@/components/AllergenWarning";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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

export default function AllergenWarningScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allAlerts, setAllAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const token = await auth.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Get meals from the last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const alerts: AlertItem[] = [];

      // Fetch meals for the last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        try {
          const response = await fetch(`${API_BASE}/meals?date=${dateStr}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const meals: Meal[] = await response.json();
            const userPrefs = await preferences.fetch();

            for (const meal of meals) {
              const foodNames = meal.items.map((item) => item.food.name);
              const analysis = await analyzeFood(foodNames, userPrefs);

              if (analysis.hasAllergenWarning || analysis.hasDietaryConflict) {
                alerts.push({
                  meal,
                  analysis,
                });
              }
            }
          }
        } catch (error) {
          console.error(`Failed to load meals for ${dateStr}:`, error);
        }
      }

      // Sort by date (most recent first)
      alerts.sort((a, b) => {
        return new Date(b.meal.occurredAt).getTime() - new Date(a.meal.occurredAt).getTime();
      });

      setAllAlerts(alerts);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.green} />
        <Text style={styles.loadingText}>Loading allergen warnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <FontAwesome name="arrow-left" size={20} color={Colors.neutral.textDark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Allergen Warnings</Text>
          <Text style={styles.headerSubtitle}>
            {allAlerts.length} {allAlerts.length === 1 ? "alert" : "alerts"} in the last 7 days
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {allAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <FontAwesome name="check-circle" size={64} color={Colors.primary.green} />
            </View>
            <Text style={styles.emptyTitle}>No Warnings! 🎉</Text>
            <Text style={styles.emptyText}>
              You haven't logged any meals with allergens or dietary conflicts in the last 7 days.
            </Text>
            <Text style={styles.emptySubtext}>
              Keep up the great work staying safe!
            </Text>
          </View>
        ) : (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {allAlerts.filter((a) => a.analysis.hasAllergenWarning).length}
                  </Text>
                  <Text style={styles.summaryLabel}>Allergen Alerts</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {allAlerts.filter((a) => a.analysis.hasDietaryConflict).length}
                  </Text>
                  <Text style={styles.summaryLabel}>Dietary Conflicts</Text>
                </View>
              </View>
            </View>

            {/* Alerts List */}
            {allAlerts.map((alert, index) => (
              <View key={alert.meal.id || index} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertDateContainer}>
                    <FontAwesome
                      name={getMealTypeIcon(alert.meal.mealType) as any}
                      size={16}
                      color={Colors.primary.orange}
                    />
                    <Text style={styles.alertDate}>
                      {formatDate(alert.meal.occurredAt)} • {formatTime(alert.meal.occurredAt)}
                    </Text>
                  </View>
                  <Text style={styles.alertMealType}>
                    {getMealTypeLabel(alert.meal.mealType)}
                  </Text>
                </View>

                <View style={styles.alertFoods}>
                  <Text style={styles.alertFoodsLabel}>Foods:</Text>
                  <Text style={styles.alertFoodsText} numberOfLines={2}>
                    {alert.meal.items.map((item) => item.food.name).join(", ")}
                  </Text>
                </View>

                <AllergenWarning analysis={alert.analysis} variant="full" />
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral.backgroundLight,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.neutral.mutedGray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.neutral.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
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
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.neutral.textDark,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
    paddingHorizontal: 32,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.neutral.mutedGray,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  summaryCard: {
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.primary.orange,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.neutral.mutedGray,
    textAlign: "center",
  },
  alertCard: {
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  alertHeader: {
    marginBottom: 12,
  },
  alertDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  alertDate: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.neutral.mutedGray,
    marginLeft: 8,
  },
  alertMealType: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.neutral.textDark,
  },
  alertFoods: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  alertFoodsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.neutral.mutedGray,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  alertFoodsText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.neutral.textDark,
    lineHeight: 20,
  },
});
