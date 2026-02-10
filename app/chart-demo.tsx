import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { ChartBox } from "@/components/charts/ChartBox";
import { mockWeeklyCalories } from "@/components/charts/mockData";
import { Theme } from "@/constants/Theme";

type RangeOption = 7 | 14;

export default function ChartDemoScreen() {
  const [range, setRange] = React.useState<RangeOption>(7);
  const data = React.useMemo(() => mockWeeklyCalories(range), [range]);

  const isActive = (value: RangeOption) => range === value;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Range</Text>
          <View style={styles.toggleButtons}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isActive(7) && styles.toggleButtonActive,
              ]}
              onPress={() => setRange(7)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  isActive(7) && styles.toggleTextActive,
                ]}
              >
                7D
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isActive(14) && styles.toggleButtonActive,
              ]}
              onPress={() => setRange(14)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  isActive(14) && styles.toggleTextActive,
                ]}
              >
                14D
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ChartBox
          title="Weekly Calories"
          unit="kcal"
          data={data}
          maxBars={7}
          emptyText="No weekly data yet"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.secondary,
  },
  content: {
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing["3xl"],
    paddingBottom: Theme.spacing["3xl"],
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.lg,
  },
  toggleLabel: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
  },
  toggleButtons: {
    flexDirection: "row",
    backgroundColor: Theme.colors.background.tertiary,
    borderRadius: Theme.radius.full,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.full,
  },
  toggleButtonActive: {
    backgroundColor: Theme.colors.primary.main,
  },
  toggleText: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.text.secondary,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: Theme.colors.text.inverse,
  },
});
