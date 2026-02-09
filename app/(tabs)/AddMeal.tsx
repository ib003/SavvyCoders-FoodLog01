import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { API_URL } from "@/lib/config";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";


// Map UI meal types -> Prisma enum values
function toPrismaMealType(t: MealType): "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" {
  switch (t) {
    case "Breakfast":
      return "BREAKFAST";
    case "Lunch":
      return "LUNCH";
    case "Dinner":
      return "DINNER";
    case "Snack":
      return "SNACK";
  }
}

async function getToken(): Promise<string | null> {
  // example if you store token in AsyncStorage:
  // const token = await AsyncStorage.getItem("token");
  // return token;

  return null; // <-- replace me
}

export default function AddMeal() {
  const router = useRouter();

  const [mealType, setMealType] = useState<MealType>("Breakfast");
  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const canContinue = useMemo(() => title.trim().length > 0, [title]);

  const onContinue = async () => {
    if (!canContinue) {
      Alert.alert("Missing info", "Please enter a meal name (example: Chicken Salad).");
      return;
    }
    if (!API_URL) {
      Alert.alert("Config error", "EXPO_PUBLIC_API_URL is missing. Add it to your .env.");
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();
      if (!token) {
        Alert.alert("Not logged in", "Please log in again.");
        return;
      }

      const res = await fetch(`${API_URL}/api/meals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          notes: notes.trim() || null,
          mealType: toPrismaMealType(mealType),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to save meal");

      // Clear form
      setTitle("");
      setNotes("");

      // Go to Saved Meals (use YOUR actual route)
      router.push("/add/saved"); // <-- change if your saved meals route differs
    } catch (e: any) {
      Alert.alert("Couldn’t save meal", e?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add Meal</Text>
        <Text style={styles.subtitle}>Pick how you want to add a meal.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meal Details</Text>

          <Text style={styles.label}>Meal Type</Text>
          <View style={styles.segmentRow}>
            {(["Breakfast", "Lunch", "Dinner", "Snack"] as MealType[]).map((t) => {
              const active = t === mealType;
              return (
                <Pressable
                  key={t}
                  onPress={() => setMealType(t)}
                  style={[styles.segment, active && styles.segmentActive]}
                  disabled={saving}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Meal Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Chicken Salad"
            placeholderTextColor={Colors.neutral.mutedGray}
            value={title}
            onChangeText={setTitle}
            autoCapitalize="words"
            returnKeyType="done"
            editable={!saving}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="How did you feel after eating? Any ingredients?"
            placeholderTextColor={Colors.neutral.mutedGray}
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={!saving}
          />

          <Pressable
            style={[styles.primaryBtn, (!canContinue || saving) && styles.btnDisabled]}
            onPress={onContinue}
            disabled={!canContinue || saving}
          >
            <Text style={styles.primaryBtnText}>
              {saving ? "Saving..." : "Save Meal"}
            </Text>
          </Pressable>
        </View>

        {/* Add methods */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add Using</Text>

          <Pressable style={styles.actionBtn} onPress={() => router.push("/add/search")}>
            <Text style={styles.actionTitle}>🔎 Search Foods</Text>
            <Text style={styles.actionSub}>Find foods from the database</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => router.push("/add/saved")}>
            <Text style={styles.actionTitle}>⭐ Saved Foods</Text>
            <Text style={styles.actionSub}>Pick from your saved list</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => router.push("/add/barcode")}>
            <Text style={styles.actionTitle}>📦 Scan Barcode</Text>
            <Text style={styles.actionSub}>Scan packaged items</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => router.push("/add/photo")}>
            <Text style={styles.actionTitle}>📷 Photo Log</Text>
            <Text style={styles.actionSub}>Snap a picture of your meal</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => router.push("/add/symptom")}>
            <Text style={styles.actionTitle}>🩺 Symptom Log</Text>
            <Text style={styles.actionSub}>Track symptoms after meals</Text>
          </Pressable>
        </View>

        <Text style={styles.footerNote}>
          If any of these pages show “route not found”, it means the file is missing in{" "}
          <Text style={styles.mono}>app/add/</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.backgroundLight },
  content: { padding: 20, paddingBottom: 40, gap: 14 },

  title: { fontSize: 30, fontWeight: "800", color: Colors.neutral.textDark },
  subtitle: { fontSize: 14, color: Colors.neutral.mutedGray, marginBottom: 4 },

  card: {
    backgroundColor: Colors.neutral.cardSurface,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Colors.neutral.textDark },

  label: { fontSize: 13, fontWeight: "600", color: Colors.neutral.textDark },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.neutral.textDark,
    backgroundColor: "#fff",
  },
  textarea: { minHeight: 90, textAlignVertical: "top" },

  segmentRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  segment: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  segmentActive: {
    borderColor: Colors.primary.green,
    backgroundColor: "rgba(46, 204, 113, 0.10)",
  },
  segmentText: { color: Colors.neutral.textDark, fontWeight: "600" },
  segmentTextActive: { color: Colors.primary.green },

  primaryBtn: {
    backgroundColor: Colors.primary.green,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  actionBtn: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  actionTitle: { fontSize: 16, fontWeight: "800", color: Colors.neutral.textDark },
  actionSub: { fontSize: 13, color: Colors.neutral.mutedGray },

  footerNote: { fontSize: 12, color: Colors.neutral.mutedGray, marginTop: 6 },
  mono: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
});