import { Theme } from "@/constants/Theme";
import { MealTypeValue } from "@/src/lib/mealTypes";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

interface MealTypeSelectorProps {
  value: MealTypeValue;
  onChange: (value: MealTypeValue) => void;
  style?: ViewStyle;
}

export function MealTypeSelector({ value, onChange, style }: MealTypeSelectorProps) {
  const breakfastSelected = value === "breakfast";
  const lunchSelected = value === "lunch";
  const dinnerSelected = value === "dinner";
  const snackSelected = value === "snack";

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Meal Type</Text>
      <View style={styles.optionsRow}>
        <Pressable
          onPress={() => onChange("breakfast")}
          style={[styles.option, breakfastSelected ? styles.optionSelected : null]}
        >
          <Text style={[styles.optionText, breakfastSelected ? styles.optionTextSelected : null]}>
            Breakfast
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onChange("lunch")}
          style={[styles.option, lunchSelected ? styles.optionSelected : null]}
        >
          <Text style={[styles.optionText, lunchSelected ? styles.optionTextSelected : null]}>
            Lunch
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onChange("dinner")}
          style={[styles.option, dinnerSelected ? styles.optionSelected : null]}
        >
          <Text style={[styles.optionText, dinnerSelected ? styles.optionTextSelected : null]}>
            Dinner
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onChange("snack")}
          style={[styles.option, snackSelected ? styles.optionSelected : null]}
        >
          <Text style={[styles.optionText, snackSelected ? styles.optionTextSelected : null]}>
            Snack
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Theme.spacing.sm },
  label: { ...Theme.typography.bodySmall, color: Theme.colors.text.secondary, fontWeight: "600" },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: Theme.spacing.sm },
  option: {
    paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.background.primary, borderWidth: 1, borderColor: Theme.colors.border.light,
  },
  optionSelected: { backgroundColor: `${Theme.colors.primary.main}15`, borderColor: Theme.colors.primary.main },
  optionText: { ...Theme.typography.caption, color: Theme.colors.text.secondary, fontWeight: "600" },
  optionTextSelected: { color: Theme.colors.primary.main },
});
