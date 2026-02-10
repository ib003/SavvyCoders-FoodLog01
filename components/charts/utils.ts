import type { ChartPoint } from "./types";

/**
 * Clamp a number between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get the maximum value from chart points. Values below 0 are treated as 0.
 * Returns fallback when data is empty or all values are non-positive.
 */
export function getMaxValue(data: ChartPoint[], fallback: number = 1): number {
  if (!data?.length) return fallback;
  const max = Math.max(
    ...data.map((p) => clamp(p.value, 0, Number.POSITIVE_INFINITY)),
  );
  return max > 0 ? max : fallback;
}

/**
 * Return an array of non-negative numbers from chart points (values < 0 become 0).
 */
export function normalizeValues(data: ChartPoint[]): number[] {
  if (!data?.length) return [];
  return data.map((p) => clamp(p.value, 0, Number.POSITIVE_INFINITY));
}
