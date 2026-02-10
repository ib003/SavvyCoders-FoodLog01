import { getLastNDaysLabels } from "@/utils/dates";
import type { ChartPoint } from "./types";

/**
 * Mock weekly calorie data for charts.
 * Returns `days` points with realistic kcal values and
 * programmatically generated day labels.
 */
export function mockWeeklyCalories(days: number = 7): ChartPoint[] {
  const labels = getLastNDaysLabels(days);
  const values = [1820, 1950, 1725, 2105, 2230, 2450, 1875];

  return labels.map((label, index) => ({
    label,
    value: values[index % values.length],
  }));
}
