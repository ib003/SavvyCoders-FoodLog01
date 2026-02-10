import { Theme } from "@/constants/Theme";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

export interface ChartLoadingStateProps {
  style?: ViewStyle;
  bars?: number;
}

export function ChartLoadingState({ style, bars = 5 }: ChartLoadingStateProps) {
  const placeholders = Array.from({ length: bars });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerSkeleton}>
        <View style={[styles.pill, styles.pillWide]} />
        <View style={[styles.pill, styles.pillNarrow]} />
      </View>

      <View style={styles.chartRow}>
        {placeholders.map((_, index) => (
          <View key={index} style={styles.barGroup}>
            <View style={[styles.bar, styles.barShort]} />
            <View style={[styles.bar, styles.barTall]} />
            <View style={[styles.bar, styles.barLabel]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Theme.spacing.sm,
  },
  headerSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.md,
  },
  pill: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.background.tertiary,
  },
  pillWide: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  pillNarrow: {
    width: 60,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
  },
  bar: {
    backgroundColor: Theme.colors.background.tertiary,
    borderRadius: Theme.radius.sm,
    marginVertical: 2,
  },
  barShort: {
    width: 10,
    height: 10,
  },
  barTall: {
    width: 16,
    height: 60,
  },
  barLabel: {
    width: 20,
    height: 8,
  },
});
