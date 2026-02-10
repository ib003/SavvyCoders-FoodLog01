import type { ChartPoint } from "./types";

/**
 * Mock weekly calorie data for charts.
 * Returns 7 points (Mon–Sun) with realistic kcal values.
 */
export function mockWeeklyCalories(): ChartPoint[] {
  return [
    { label: "Mon", value: 1820 },
    { label: "Tue", value: 1950 },
    { label: "Wed", value: 1725 },
    { label: "Thu", value: 2105 },
    { label: "Fri", value: 2230 },
    { label: "Sat", value: 2450 },
    { label: "Sun", value: 1875 },
  ];
}
