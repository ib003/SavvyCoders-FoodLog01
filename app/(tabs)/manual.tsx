import { Card } from "@/components/ui/Card";
import { KeyboardDismissAccessory } from "@/components/ui/KeyboardDismissAccessory";
import { MealTypeSelector } from "@/components/ui/MealTypeSelector";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { TextField } from "@/components/ui/TextField";
import { Theme } from "@/constants/Theme";
import { API_BASE } from "@/src/constants/api";
import { auth } from "@/src/lib/auth";
import { MealTypeValue } from "@/src/lib/mealTypes";
import { saveFood } from "../../src/_api/savedFoods";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ManualEntry() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [sugar, setSugar] = useState("");
  const [sodium, setSodium] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [servingUnit, setServingUnit] = useState("");
  const [mealType, setMealType] = useState<MealTypeValue>("snack");
  const [saving, setSaving] = useState(false);

  const n = (val: string) => parseFloat(val) || 0;

  const foodData = {
    name: name.trim() || "Custom Food",
    calories: n(calories) || null,
    protein: n(protein),
    carbs: n(carbs),
    fat: n(fat),
    fiber: n(fiber),
    sugar: n(sugar),
    sodium: n(sodium),
    servingSize: n(servingSize) || null,
    servingUnit: servingUnit.trim() || null,
    source: "UPC_API",
  };

  const handleSaveToFoods = async () => {
    if (!name.trim()) { Alert.alert("Error", "Please enter a food name."); return; }
    setSaving(true);
    try {
      await saveFood(foodData);
      Alert.alert("Saved!", `${name} saved to your food list.`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAsMeal = async () => {
    if (!name.trim()) { Alert.alert("Error", "Please enter a food name."); return; }
    setSaving(true);
    try {
      const token = await auth.getToken();
      const res = await fetch(`${API_BASE}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          occurred_at: new Date().toISOString(),
          meal_type: mealType,
          items: [{ ...foodData, kcal: foodData.calories }],
        }),
      });
      if (!res.ok) throw new Error("Failed to add meal");
      Alert.alert("Added!", `${name} added to your ${mealType}.`, [
        { text: "OK", onPress: () => router.replace("/(tabs)/Dashboard") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const numericFields = [
    { label: "Calories", value: calories, set: setCalories },
    { label: "Protein (g)", value: protein, set: setProtein },
    { label: "Carbs (g)", value: carbs, set: setCarbs },
    { label: "Fat (g)", value: fat, set: setFat },
    { label: "Fiber (g)", value: fiber, set: setFiber },
    { label: "Sugar (g)", value: sugar, set: setSugar },
    { label: "Sodium (mg)", value: sodium, set: setSodium },
    { label: "Serving Size", value: servingSize, set: setServingSize },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.topSafeArea, { height: insets.top }]} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(tabs)/AddMeal")}>
          <FontAwesome name="arrow-left" size={18} color={Theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual Entry</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {name.trim() ? (
          <Card style={styles.preview} padding="lg" variant="elevated">
            <Text style={styles.previewName}>{name.trim()}</Text>
            <View style={styles.previewMacros}>
              {n(calories) > 0 && <Text style={styles.previewMacro}>{Math.round(n(calories))} kcal</Text>}
              {n(protein) > 0 && <Text style={styles.previewMacro}>{n(protein)}g protein</Text>}
              {n(carbs) > 0 && <Text style={styles.previewMacro}>{n(carbs)}g carbs</Text>}
              {n(fat) > 0 && <Text style={styles.previewMacro}>{n(fat)}g fat</Text>}
            </View>
          </Card>
        ) : null}

        <TextField label="Food Name *" placeholder="e.g. Homemade Pasta" value={name} onChangeText={setName} />

        <Text style={styles.sectionLabel}>Nutrition (per serving)</Text>
        {[0, 2, 4, 6].map(i => (
          <View key={i} style={styles.row}>
            {numericFields.slice(i, i + 2).map(f => (
              <View key={f.label} style={styles.halfField}>
                <TextField label={f.label} placeholder="0" value={f.value} onChangeText={f.set} keyboardType="decimal-pad" />
              </View>
            ))}
          </View>
        ))}

        <TextField label="Serving Unit" placeholder="g, oz, cup..." value={servingUnit} onChangeText={setServingUnit} />

        <Text style={styles.sectionLabel}>Meal Type</Text>
        <MealTypeSelector value={mealType} onChange={setMealType} style={styles.mealTypeSelector} />

        <PrimaryButton title="Add as Meal" onPress={handleAddAsMeal} loading={saving} disabled={saving} style={styles.button} />
        <SecondaryButton title="Save to Saved Foods" onPress={handleSaveToFoods} disabled={saving} style={styles.button} />
      </ScrollView>
      <KeyboardDismissAccessory />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background.secondary },
  topSafeArea: { backgroundColor: Theme.colors.background.primary },
  header: { flexDirection: "row", alignItems: "center", backgroundColor: Theme.colors.background.primary, padding: Theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: Theme.colors.border.light, gap: Theme.spacing.md },
  backButton: { width: 40, height: 40, borderRadius: Theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.background.secondary, borderWidth: 1, borderColor: Theme.colors.border.light },
  headerTitle: { ...Theme.typography.sectionTitle, color: Theme.colors.text.primary },
  content: { flex: 1 },
  contentContainer: { padding: Theme.spacing.lg, paddingBottom: Theme.spacing['3xl'] },
  preview: { marginBottom: Theme.spacing.lg },
  previewName: { ...Theme.typography.sectionTitle, color: Theme.colors.text.primary, marginBottom: Theme.spacing.sm },
  previewMacros: { flexDirection: "row", flexWrap: "wrap", gap: Theme.spacing.sm },
  previewMacro: { backgroundColor: `${Theme.colors.primary.main}15`, color: Theme.colors.primary.main, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.xs, borderRadius: Theme.radius.full, ...Theme.typography.captionSmall, fontWeight: "600" },
  sectionLabel: { ...Theme.typography.captionSmall, fontWeight: "700", color: Theme.colors.text.secondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: Theme.spacing.sm, marginTop: Theme.spacing.xs },
  row: { flexDirection: "row", gap: Theme.spacing.md },
  halfField: { flex: 1 },
  mealTypeSelector: { marginBottom: Theme.spacing.lg },
  button: { marginBottom: Theme.spacing.md },
});
