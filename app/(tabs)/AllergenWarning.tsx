import AllergenWarning from "@/components/AllergenWarning";
import { Card } from "@/components/ui/Card";
import { Theme } from "@/constants/Theme";
import { API_BASE } from "@/src/constants/api";
import { analyzeFood } from "@/src/lib/allergenChecker";
import { auth } from "@/src/lib/auth";
import { preferences } from "@/src/lib/preferences";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const alerts: AlertItem[] = [];

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
            const meals = await response.json();
            const userPrefs = await preferences.fetch();

            for (const meal of meals) {
              const foodNames = meal.items.map((item: any) => item.food.name);
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
        <ActivityIndicator size="large" color={Theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading allergen warnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[Theme.colors.background.gradient[0], Theme.colors.background.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <FontAwesome name="arrow-left" size={20} color={Theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Allergen Warnings</Text>
            <Text style={styles.headerSubtitle}>
              {allAlerts.length} {allAlerts.length === 1 ? "alert" : "alerts"} in the last 7 days
            </Text>
          </View>
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
        {allAlerts.length === 0 ? (
          <Card style={styles.emptyContainer} padding="2xl" variant="outlined">
            <View style={styles.emptyIconContainer}>
              <FontAwesome name="check-circle" size={64} color={Theme.colors.primary.main} />
            </View>
            <Text style={styles.emptyTitle}>No Warnings! 🎉</Text>
            <Text style={styles.emptyText}>
              You haven't logged any meals with allergens or dietary conflicts in the last 7 days.
            </Text>
            <Text style={styles.emptySubtext}>
              Keep up the great work staying safe!
            </Text>
          </Card>
        ) : (
          <>
            {/* Summary Card */}
            <Card style={styles.summaryCard} padding="lg" variant="elevated">
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
            </Card>

            {/* Alerts List */}
            {allAlerts.map((alert, index) => (
              <Card key={alert.meal.id || index} style={styles.alertCard} padding="lg" variant="elevated">
                <View style={styles.alertHeader}>
                  <View style={styles.alertDateContainer}>
                    <FontAwesome
                      name={getMealTypeIcon(alert.meal.mealType) as any}
                      size={16}
                      color={Theme.colors.accent.orange}
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
              </Card>
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
    backgroundColor: Theme.colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.background.secondary,
  },
  loadingText: {
    ...Theme.typography.body,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.lg,
  },
  headerGradient: {
    paddingTop: Theme.spacing['5xl'],
    paddingBottom: Theme.spacing['2xl'],
    paddingHorizontal: Theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.md,
    backgroundColor: Theme.colors.background.primary,
    ...Theme.shadows.card,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...Theme.typography.title,
    fontSize: 28,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  headerSubtitle: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing['3xl'],
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: Theme.spacing['3xl'],
  },
  emptyIconContainer: {
    marginBottom: Theme.spacing['2xl'],
  },
  emptyTitle: {
    ...Theme.typography.title,
    fontSize: 24,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  emptyText: {
    ...Theme.typography.body,
    color: Theme.colors.text.primary,
    textAlign: "center",
    marginBottom: Theme.spacing.sm,
  },
  emptySubtext: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
  summaryCard: {
    marginBottom: Theme.spacing.lg,
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
    backgroundColor: Theme.colors.border.light,
  },
  summaryValue: {
    ...Theme.typography.title,
    fontSize: 36,
    color: Theme.colors.accent.orange,
    marginBottom: Theme.spacing.xs,
  },
  summaryLabel: {
    ...Theme.typography.caption,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
  alertCard: {
    marginBottom: Theme.spacing.md,
  },
  alertHeader: {
    marginBottom: Theme.spacing.md,
  },
  alertDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  alertDate: {
    ...Theme.typography.caption,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.sm,
  },
  alertMealType: {
    ...Theme.typography.body,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  alertFoods: {
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  alertFoodsLabel: {
    ...Theme.typography.captionSmall,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  alertFoodsText: {
    ...Theme.typography.bodySmall,
    fontWeight: '500',
    color: Theme.colors.text.primary,
    lineHeight: 20,
  },
});
