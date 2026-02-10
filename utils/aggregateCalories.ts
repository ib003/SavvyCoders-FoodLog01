import { getLast7DayLabels } from "./dates";

/**
 * Minimal meal/entry shape used by the app (Dashboard, API).
 * Pass an array of meals from GET /meals or similar.
 */
export interface MealEntry {
  occurredAt: string;
  items: Array<{
    food: { kcal?: number };
    qty: number;
  }>;
}

export interface DayCalories {
  label: string;
  value: number;
}

/**
 * Get local YYYY-MM-DD for a date (for grouping by calendar day).
 */
function toLocalDateKey(isoDate: string): string {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Sum calories for one meal: sum of (kcal * qty) per item.
 * NaN/undefined treated as 0.
 */
function mealTotalKcal(meal: MealEntry): number {
  return (meal.items ?? []).reduce((sum, item) => {
    const kcal = Number(item?.food?.kcal);
    const qty = Number(item?.qty);
    const safeKcal = Number.isFinite(kcal) && kcal >= 0 ? kcal : 0;
    const safeQty = Number.isFinite(qty) && qty >= 0 ? qty : 0;
    return sum + safeKcal * safeQty;
  }, 0);
}

/**
 * Aggregate meal entries into daily calories for the last 7 days.
 * Returns one { label, value } per day (oldest → newest), e.g. [ { label: "Mon", value: 1820 }, ... ].
 * Days with no meals have value 0.
 */
export function aggregateCaloriesLast7Days(
  entries: MealEntry[],
): DayCalories[] {
  const labels = getLast7DayLabels();
  const today = new Date();
  const dateKeys = new Set<string>();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dateKeys.add(`${y}-${m}-${day}`);
  }
  const orderedKeys = Array.from(dateKeys).sort();

  const byDay = new Map<string, number>();
  orderedKeys.forEach((key) => byDay.set(key, 0));

  const safeEntries = Array.isArray(entries) ? entries : [];
  for (const meal of safeEntries) {
    const key = toLocalDateKey(meal.occurredAt ?? "");
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) ?? 0) + mealTotalKcal(meal));
    }
  }

  return labels.map((label, i) => ({
    label,
    value: byDay.get(orderedKeys[i]) ?? 0,
  }));
}
