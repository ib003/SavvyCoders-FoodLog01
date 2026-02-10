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
            {data.map((item) => (
              <View key={item.label} style={styles.row}>
                <View style={styles.labelWrapper}>
                  <View style={styles.bullet} />
                  <Text style={styles.label}>{item.label}</Text>
                </View>
                <Text style={styles.value}>
                  {item.value}
                  {unit ? ` ${unit}` : ""}
                </Text>
              </View>
            ))}
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
    gap: Theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: Theme.spacing.sm,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary.main,
    marginRight: Theme.spacing.sm,
  },
  label: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
  },
  value: {
    ...Theme.typography.body,
    color: Theme.colors.text.primary,
    fontWeight: "600",
  },
});
