/**
 * Return labels for the last N days, oldest → newest.
 * Uses locale-aware short weekday names (e.g., Mon, Tue, ...).
 */
export function getLastNDaysLabels(days: number, locale?: string): string[] {
  const safeDays = Math.max(1, Math.floor(days));
  const labels: string[] = [];
  const today = new Date();

  for (let offset = safeDays - 1; offset >= 0; offset -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    labels.push(
      d.toLocaleDateString(locale ?? undefined, {
        weekday: "short",
      }),
    );
  }

  return labels;
}

/**
 * Convenience wrapper for 7-day labels.
 */
export function getLast7DayLabels(locale?: string): string[] {
  return getLastNDaysLabels(7, locale);
}
