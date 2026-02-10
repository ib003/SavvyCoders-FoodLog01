import { getLastNDaysLabels } from "@/utils/dates";
import type { ChartPoint } from "./types";
import { clamp, getMaxValue, normalizeValues } from "./utils";

let _chartUtilsAsserted = false;

/**
 * Dev-only: assert chart utils behavior (clamp, getMaxValue, normalizeValues).
 * Runs once per process when mock data is first used.
 */
export function devAssertChartUtils(): void {
  if (typeof __DEV__ !== "undefined" && !__DEV__) return;
  if (_chartUtilsAsserted) return;
  _chartUtilsAsserted = true;

  // clamp: in-range, negative → 0, NaN → min
  console.assert(clamp(5, 0, 10) === 5, "chart utils: clamp in-range");
  console.assert(clamp(-1, 0, 10) === 0, "chart utils: clamp negative → 0");
  console.assert(clamp(NaN, 0, 10) === 0, "chart utils: clamp NaN → min");
  console.assert(clamp(100, 0, 10) === 10, "chart utils: clamp above max");

  // getMaxValue: normal, empty → fallback, NaN in data → fallback
  const points: ChartPoint[] = [
    { label: "a", value: 10 },
    { label: "b", value: 20 },
  ];
  console.assert(getMaxValue(points) === 20, "chart utils: getMaxValue max");
  console.assert(
    getMaxValue([]) === 1,
    "chart utils: getMaxValue empty fallback",
  );
  console.assert(
    getMaxValue([{ label: "x", value: NaN }]) === 1,
    "chart utils: getMaxValue NaN fallback",
  );

  // normalizeValues: negative → 0, length
  const norm = normalizeValues([
    { label: "a", value: 5 },
    { label: "b", value: -1 },
  ]);
  console.assert(
    norm.length === 2 && norm[0] === 5 && norm[1] === 0,
    "chart utils: normalizeValues",
  );
}

/**
 * Mock weekly calorie data for charts.
 * Returns `days` points with realistic kcal values and
 * programmatically generated day labels.
 */
export function mockWeeklyCalories(days: number = 7): ChartPoint[] {
  devAssertChartUtils(); // run once when mock data is first used in dev
  const labels = getLastNDaysLabels(days);
  const values = [1820, 1950, 1725, 2105, 2230, 2450, 1875];

  return labels.map((label, index) => ({
    label,
    value: values[index % values.length],
  }));
}
