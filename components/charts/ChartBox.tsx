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
  maxBars = 7,
}: ChartBoxProps) {
  // NaN/non-finite -> display placeholder
  const formatValue = (value: number) => {
    if (!Number.isFinite(value)) return "—";
    const abs = Math.abs(value);
    if (abs >= 100) return String(Math.round(value));
    if (abs >= 10) return value.toFixed(1).replace(/\.0$/, "");
    return value.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
  };

  const hasData = data && data.length > 0;
  const points = hasData
    ? data.length > maxBars
      ? data.slice(-maxBars)
      : data
    : [];

  const latest = hasData ? data[data.length - 1] : undefined;
  const normalizedValues = normalizeValues(points); // NaN/negative already 0 in utils
  const maxValue = getMaxValue(points, 1); // always >= 1 when has data

  const summary = React.useMemo(() => {
    const fullNormalized = normalizeValues(data);
    if (fullNormalized.length === 0) return { total: 0, avg: 0 };
    const total = fullNormalized.reduce(
      (acc, v) => acc + (Number.isFinite(v) ? v : 0),
      0,
    );
    const avg =
      fullNormalized.length > 0 && Number.isFinite(total)
        ? total / fullNormalized.length
        : 0;
    return { total, avg };
  }, [data]);

  const headerLabel = [
    title,
    subtitle ?? "",
    latest
      ? `Latest value ${formatValue(latest.value)}${unit ? ` ${unit}` : ""}`
      : "",
  ]
    .filter(Boolean)
    .join(". ");
  const headerHint =
    "Chart summary. Total and average are shown at the bottom.";

  return (
    <Card style={[styles.container, style]} padding="lg" variant="elevated">
      <View
        style={styles.header}
        accessibilityLabel={headerLabel}
        accessibilityHint={headerHint}
        accessibilityRole="header"
      >
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
                // Guard division: avoid NaN when maxValue is 0 (shouldn't happen)
                const heightRatio =
                  Number.isFinite(maxValue) && maxValue > 0
                    ? normalizedValue / maxValue
                    : 0;
                const rawHeight = 120 * heightRatio + 4;
                const barHeight = Math.max(
                  0,
                  Number.isFinite(rawHeight) ? rawHeight : 4,
                ); // minimum sliver
                const valueStr = formatValue(normalizedValue);
                const barLabel = `${item.label}: ${valueStr}${unit ? ` ${unit}` : ""}`;
                const barHint = `Bar ${i + 1} of ${points.length}, value ${valueStr}`;

                return (
                  <View
                    key={item.label}
                    style={styles.barGroup}
                    accessibilityLabel={barLabel}
                    accessibilityHint={barHint}
                    accessibilityRole="text"
                  >
                    <Text style={styles.barValue}>{valueStr}</Text>
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
