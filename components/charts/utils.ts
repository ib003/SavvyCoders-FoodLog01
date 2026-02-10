import type { ChartPoint } from "./types";

/**
 * Clamp a number between min and max (inclusive).
 * NaN/negative or non-finite values are treated as min before clamping.
 */
export function clamp(value: number, min: number, max: number): number {
  const safe = Number.isFinite(value) ? value : min;
  return Math.min(Math.max(safe, min), max);
}

/**
 * Get the maximum value from chart points. NaN/negative values treated as 0.
 * Returns fallback when data is empty or all values are non-positive.
 */
export function getMaxValue(data: ChartPoint[], fallback: number = 1): number {
  if (!data?.length) return fallback;
  const max = Math.max(
    ...data.map((p) => clamp(p.value, 0, Number.POSITIVE_INFINITY)),
  );
  const result = Number.isFinite(max) && max > 0 ? max : fallback;
  return result;
}

/**
 * Non-negative values from chart points; NaN/negative treated as 0.
 */
export function normalizeValues(data: ChartPoint[]): number[] {
  if (!data?.length) return [];
  return data.map((p) => clamp(p.value, 0, Number.POSITIVE_INFINITY));
}
