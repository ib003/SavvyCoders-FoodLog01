/**
 * Return labels for the last 7 days, oldest → newest.
 * Uses locale-aware short weekday names (e.g., Mon, Tue, ...).
 */
export function getLast7DayLabels(locale?: string): string[] {
  const labels: string[] = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
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
