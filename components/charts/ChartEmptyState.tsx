import { Theme } from "@/constants/Theme";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

export interface ChartEmptyStateProps {
  message?: string;
  style?: ViewStyle;
}

export function ChartEmptyState({
  message = "No data available yet",
  style,
}: ChartEmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.dotRow}>
        <View style={[styles.dot, styles.dotPrimary]} />
        <View style={[styles.dot, styles.dotMuted]} />
        <View style={[styles.dot, styles.dotMuted]} />
      </View>
      <Text style={styles.title}>Nothing to show yet</Text>
      <Text style={styles.subtitle}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.lg,
  },
  dotRow: {
    flexDirection: "row",
    marginBottom: Theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  dotPrimary: {
    backgroundColor: Theme.colors.primary.main,
  },
  dotMuted: {
    backgroundColor: Theme.colors.text.muted,
  },
  title: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
    fontWeight: "600",
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.text.tertiary,
    textAlign: "center",
  },
});
