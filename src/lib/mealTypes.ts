export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export type MealTypeValue = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealTypeValue, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};
