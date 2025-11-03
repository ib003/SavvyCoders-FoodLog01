import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Profile() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietTags, setSelectedDietTags] = useState<string[]>([]);

  const ALLERGENS = [
    "Peanuts",
    "Tree Nuts",
    "Dairy",
    "Eggs",
    "Gluten",
    "Soy",
    "Fish",
    "Shellfish",
    "Sesame",
  ];

  const DIET_TAGS = [
    "Vegan",
    "Vegetarian",
    "Pescatarian",
    "Halal",
    "Kosher",
    "Keto",
    "Lactose-free",
  ];

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("user_email");
      setEmail(saved);
      const a = await AsyncStorage.getItem("user_allergens");
      const d = await AsyncStorage.getItem("user_diet_tags");
      if (a) setSelectedAllergens(JSON.parse(a));
      if (d) setSelectedDietTags(JSON.parse(d));
    })();
  }, []);

  const onLogout = async () => {
    await AsyncStorage.multiRemove(["auth_token", "user_email"]);
    router.replace("/");
  };

  const toggleItem = (current: string[], value: string, setter: (v: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const onSavePrefs = async () => {
    await AsyncStorage.setItem("user_allergens", JSON.stringify(selectedAllergens));
    await AsyncStorage.setItem("user_diet_tags", JSON.stringify(selectedDietTags));
    Alert.alert("Saved", "Preferences updated");
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email ?? "demo@savvytrack.app"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Allergies & Intolerances</Text>
        <View style={styles.chipsWrap}>
          {ALLERGENS.map(item => {
            const active = selectedAllergens.includes(item);
            return (
              <Pressable
                key={item}
                onPress={() => toggleItem(selectedAllergens, item, setSelectedAllergens)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Dietary Tags</Text>
        <View style={styles.chipsWrap}>
          {DIET_TAGS.map(item => {
            const active = selectedDietTags.includes(item);
            return (
              <Pressable
                key={item}
                onPress={() => toggleItem(selectedDietTags, item, setSelectedDietTags)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable style={[styles.btn, { flex: 1 }]} onPress={onSavePrefs}>
          <Text style={styles.btnText}>Save preferences</Text>
        </Pressable>
        <Pressable style={[styles.btnSecondary, { flex: 1 }]} onPress={onLogout}>
          <Text style={styles.btnSecondaryText}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: "#FAFAFA" },
  container: { padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#2E2E2E" },
  card: {
    borderWidth: 1, borderColor: "#EDEDED", borderRadius: 14, padding: 16, backgroundColor: "#FFFFFF"
  },
  label: { fontSize: 12, color: "#A6A6A6" },
  value: { fontSize: 16, fontWeight: "600", marginTop: 4, color: "#2E2E2E" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: "#2E2E2E" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#A6A6A6",
    backgroundColor: "#FFFFFF"
  },
  chipActive: {
    backgroundColor: "#5DBB63",
    borderColor: "#5DBB63"
  },
  chipText: { color: "#2E2E2E", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  btn: { backgroundColor: "#5DBB63", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "white", fontWeight: "700" },
  btnSecondary: { backgroundColor: "#d17575ff", padding: 14, borderRadius: 12, alignItems: "center" },
  btnSecondaryText: { color: "#FFFFFF", fontWeight: "700" },
});
