import { Card } from "@/components/ui/Card";
import { Theme } from "@/constants/Theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ChartBoxProps } from "./types";

export function ChartBox({
  title,
  subtitle,
  data,
  unit,
  loading = false,
  emptyText = "No data",
  style,
}: ChartBoxProps) {
  const hasData = data && data.length > 0;
  const maxPoints = 7;
  const points = hasData
    ? data.length > maxPoints
      ? data.slice(-maxPoints)
      : data
    : [];

  const maxValue =
    points.length > 0
      ? Math.max(...points.map((p) => (p.value < 0 ? 0 : p.value)), 1)
      : 1;

  return (
    <Card style={[styles.container, style]} padding="lg" variant="elevated">
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      <View style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading chart data...</Text>
        ) : !hasData ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : (
          <View style={styles.chartWrapper}>
            {points.map((item) => {
              const normalizedValue = item.value < 0 ? 0 : item.value;
              const heightRatio = normalizedValue / maxValue;
              const barHeight = 120 * heightRatio + 4; // keep a minimum sliver

              return (
                <View key={item.label} style={styles.barGroup}>
                  <Text style={styles.barValue}>
                    {normalizedValue}
                    {unit ? "" : ""}
                  </Text>
                  <View style={styles.barOuter}>
                    <View style={[styles.barInner, { height: barHeight }]} />
                  </View>
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.md,
  },
  headerText: {
    flex: 1,
    paddingRight: Theme.spacing.md,
  },
  title: {
    ...Theme.typography.sectionTitle,
    color: Theme.colors.text.primary,
  },
  subtitle: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.xs,
  },
  unit: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
  },
  content: {
    marginTop: Theme.spacing.sm,
  },
  loadingText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.tertiary,
  },
  emptyText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.tertiary,
    fontStyle: "italic",
  },
  chartWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
  },
  barOuter: {
    height: 140,
    width: 16,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.background.tertiary,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barInner: {
    width: "100%",
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.primary.main,
  },
  barValue: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  barLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.xs,
  },
});
