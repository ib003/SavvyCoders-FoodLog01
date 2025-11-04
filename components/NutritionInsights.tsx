import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function NutritionInsights() {
  //mock deficiency for demo
  const deficiency = {
    nutrient: "Fiber",
    current: 12,
    recommended: 25,
    unit: "g",
    percentage: 48,
    suggestion: "Diet low in fiber",
    foods: ["beans", "lentils", "whole grains", "berries"],
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FontAwesome name="bar-chart" size={20} color={Colors.primary.green} style={{ marginRight: 8 }} />
        <Text style={styles.sectionTitle}>Nutrition Insights</Text>
        <View style={styles.alertCountBadge}>
          <Text style={styles.alertCountText}>1</Text>
        </View>
      </View>

      <View style={styles.insightsCard}>
        <Text style={styles.insightsDescription}>Based on your food history, here are nutrients that may need attention:</Text>

        <View style={styles.deficiencyItem}>
          <View style={styles.deficiencyHeader}>
            <View style={styles.deficiencyIconContainer}>
              <FontAwesome name="exclamation-circle" size={18} color={Colors.primary.orange} />
            </View>
            <View style={styles.deficiencyInfo}>
              <Text style={styles.deficiencyNutrient}>{deficiency.nutrient}</Text>
              <Text style={styles.deficiencyStats}>{deficiency.current} {deficiency.unit} / {deficiency.recommended} {deficiency.unit} ({deficiency.percentage}%)</Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${deficiency.percentage}%`, backgroundColor: Colors.primary.orange }]} />
            </View>
          </View>

          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionText}>{deficiency.suggestion}. Consider eating foods such as {deficiency.foods.slice(0, 3).join(", ")}, or {deficiency.foods[3]}.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: Colors.neutral.textDark, flex: 1 },
  alertCountBadge: { backgroundColor: Colors.primary.orange, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, minWidth: 24, alignItems: "center" },
  alertCountText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  insightsCard: { backgroundColor: Colors.neutral.cardSurface, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  insightsDescription: { fontSize: 14, color: Colors.neutral.mutedGray, marginBottom: 16, lineHeight: 20 },
  deficiencyItem: { marginBottom: 0 },
  deficiencyHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  deficiencyIconContainer: { marginRight: 12, marginTop: 2 },
  deficiencyInfo: { flex: 1 },
  deficiencyNutrient: { fontSize: 16, fontWeight: "700", color: Colors.neutral.textDark, marginBottom: 4 },
  deficiencyStats: { fontSize: 13, color: Colors.neutral.mutedGray, fontWeight: "500" },
  progressBarContainer: { marginBottom: 12 },
  progressBarBackground: { height: 8, backgroundColor: "#F0F0F0", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  suggestionBox: { backgroundColor: `${Colors.primary.green}10`, borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: Colors.primary.green },
  suggestionText: { fontSize: 13, color: Colors.neutral.textDark, lineHeight: 18 },
});
