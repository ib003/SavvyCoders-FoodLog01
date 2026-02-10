import { Card } from "@/components/ui/Card";
import { Theme } from "@/constants/Theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { ChartEmptyState } from "./ChartEmptyState";
import { ChartLoadingState } from "./ChartLoadingState";
import type { ChartBoxProps } from "./types";
import { getMaxValue, normalizeValues } from "./utils";

export function ChartBox({
  title,
  subtitle,
  data,
  unit,
  loading = false,
  emptyText = "No data",
  style,
}: ChartBoxProps) {
  const formatValue = (value: number) => {
    if (!Number.isFinite(value)) return "—";
    const abs = Math.abs(value);
    if (abs >= 100) return String(Math.round(value));
    if (abs >= 10) return value.toFixed(1).replace(/\.0$/, "");
    return value.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
  };

  const hasData = data && data.length > 0;
  const maxPoints = 7;
  const points = hasData
    ? data.length > maxPoints
      ? data.slice(-maxPoints)
      : data
    : [];

  const latest = hasData ? data[data.length - 1] : undefined;
  const normalizedValues = normalizeValues(points);
  const maxValue = getMaxValue(points, 1);

  const summary = React.useMemo(() => {
    if (normalizedValues.length === 0) return { total: 0, avg: 0 };
    const total = normalizedValues.reduce((acc, v) => acc + v, 0);
    const avg = total / normalizedValues.length;
    return { total, avg };
  }, [normalizedValues]);

  return (
    <Card style={[styles.container, style]} padding="lg" variant="elevated">
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {latest ? (
          <View style={styles.headerRight}>
            <Text style={styles.latestValue}>
              {formatValue(latest.value)}
              {unit ? ` ${unit}` : ""}
            </Text>
            {unit ? <Text style={styles.unit}>{unit}</Text> : null}
          </View>
        ) : unit ? (
          <Text style={styles.unit}>{unit}</Text>
        ) : null}
      </View>

      <View style={styles.content}>
        {loading ? (
          <ChartLoadingState />
        ) : !hasData ? (
          <ChartEmptyState message={emptyText} />
        ) : (
          <View>
            <View style={styles.chartWrapper}>
              {points.map((item, i) => {
                const normalizedValue = normalizedValues[i] ?? 0;
                const heightRatio = normalizedValue / maxValue;
                const barHeight = 120 * heightRatio + 4; // keep a minimum sliver

                return (
                  <View key={item.label} style={styles.barGroup}>
                    <Text style={styles.barValue}>
                      {formatValue(normalizedValue)}
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

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {formatValue(summary.total)}
                  {unit ? ` ${unit}` : ""}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {formatValue(summary.avg)}
                  {unit ? ` ${unit}` : ""}
                </Text>
              </View>
            </View>
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
  headerRight: {
    alignItems: "flex-end",
  },
  latestValue: {
    ...Theme.typography.body,
    color: Theme.colors.text.primary,
    fontWeight: "700",
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
  summaryRow: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    minWidth: 0,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: Theme.colors.border.light,
    marginHorizontal: Theme.spacing.md,
  },
  summaryLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.text.tertiary,
  },
  summaryValue: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.primary,
    fontWeight: "600",
    marginTop: Theme.spacing.xs,
  },
});
