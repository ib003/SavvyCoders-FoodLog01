import { KeyboardDismissAccessory, KEYBOARD_DISMISS_ACCESSORY_ID } from "@/components/ui/KeyboardDismissAccessory";
import { auth } from "@/src/lib/auth";
import { symptoms } from "@/src/lib/symptoms";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Symptom() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [physicalSymptoms, setPhysicalSymptoms] = useState<string[]>([]);
  const [mentalSymptoms, setMentalSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await auth.isAuthenticated();
      if (!isAuth) router.replace("/");
    };
    checkAuth();
  }, []);

  //list of food-related physical symptoms
  const PHYSICAL_SYMPTOMS = ["Bloating", "Stomach pain", "Gas", "Nausea", "Heartburn", "Indigestion", "Constipation", "Diarrhea", "Fatigue"];

  //list of food-related mental symptoms
  const MENTAL_SYMPTOMS = ["Brain fog", "Low energy", "Difficulty concentrating", "Mood swings", "Irritability"];

  //toggle symptom selection
  function toggleSymptom(current: string[], value: string, setter: (v: string[]) => void) {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  }

  //convert severity number to mild/moderate/severe
  function getSeverityLevel(): "mild" | "moderate" | "severe" {
    const num = parseInt(severity);
    if (num >= 1 && num <= 3) return "mild";
    if (num >= 4 && num <= 7) return "moderate";
    return "severe";
  }

  //save symptoms to storage
  async function saveSymptoms() {
    const allSymptoms = [...physicalSymptoms, ...mentalSymptoms];
    if (allSymptoms.length === 0) {
      Alert.alert("No symptoms", "Please select at least one symptom");
      return;
    }

    try {
      const existingSymptoms = await symptoms.getTodaySymptoms();
      const existingNames = existingSymptoms.map(s => s.name.toLowerCase());
      const newSymptoms: string[] = [];
      const duplicates: string[] = [];
      
      for (const symptomName of allSymptoms) {
        if (existingNames.includes(symptomName.toLowerCase())) {
          duplicates.push(symptomName);
        } else {
          newSymptoms.push(symptomName);
        }
      }
      
      if (newSymptoms.length === 0) {
        Alert.alert("No new symptoms", `All selected symptoms (${duplicates.join(", ")}) have already been logged today`, [{ text: "OK", onPress: () => router.replace("/Dashboard") }]);
        return;
      }
      
      if (duplicates.length > 0) {
        Alert.alert("Duplicate symptoms detected", `${duplicates.join(", ")} already logged today. Only new symptoms will be saved.`, [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: async () => {
            const severityLevel = severity ? getSeverityLevel() : "mild";
            const notes = undefined;
            
            for (const symptomName of newSymptoms) {
              await symptoms.addSymptom(symptomName, severityLevel, notes);
            }
            
            Alert.alert("Saved", `${newSymptoms.length} symptom(s) logged successfully`, [{ text: "OK", onPress: () => router.replace("/Dashboard") }]);
          }}
        ]);
        return;
      }
      
      const severityLevel = severity ? getSeverityLevel() : "mild";
      const notes = undefined;
      
      for (const symptomName of newSymptoms) {
        await symptoms.addSymptom(symptomName, severityLevel, notes);
      }
      
      Alert.alert("Saved", `${newSymptoms.length} symptom(s) logged successfully`, [{ text: "OK", onPress: () => router.replace("/Dashboard") }]);
    } catch (error) {
      Alert.alert("Error", "Failed to save symptoms");
    }
  }

  //show mock food suggestions based on selected symptoms
  function showSuggestions() {
    const allSymptoms = [...physicalSymptoms, ...mentalSymptoms];
    if (allSymptoms.length === 0) {
      Alert.alert("No symptoms", "Please select at least one symptom");
      setSuggestions([]);
      return;
    }

    //match symptoms to food suggestions
    const newSuggestions: string[] = [];
    
    if (allSymptoms.some(s => ["fatigue", "brain fog", "low energy"].includes(s.toLowerCase()))) {
      newSuggestions.push("Try adding more water and foods rich in magnesium (nuts, leafy greens)");
    }
    if (allSymptoms.some(s => ["bloating", "gas", "stomach pain"].includes(s.toLowerCase()))) {
      newSuggestions.push("Consider avoiding high-FODMAP foods and try ginger tea");
    }
    if (allSymptoms.some(s => ["mood swings", "irritability"].includes(s.toLowerCase()))) {
      newSuggestions.push("Foods high in omega-3 (salmon, walnuts) and complex carbs may help");
    }
    if (allSymptoms.some(s => ["nausea", "indigestion", "heartburn"].includes(s.toLowerCase()))) {
      newSuggestions.push("Try bland foods like rice, bananas, or toast");
    }
    if (allSymptoms.some(s => ["constipation"].includes(s.toLowerCase()))) {
      newSuggestions.push("Increase fiber intake with fruits, vegetables, and whole grains");
    }
    if (allSymptoms.some(s => ["diarrhea"].includes(s.toLowerCase()))) {
      newSuggestions.push("Try BRAT diet (bananas, rice, applesauce, toast) and stay hydrated");
    }
    if (allSymptoms.some(s => ["difficulty concentrating"].includes(s.toLowerCase()))) {
      newSuggestions.push("Consider foods with omega-3 and B vitamins (fish, eggs, leafy greens)");
    }
    if (newSuggestions.length === 0) {
      newSuggestions.push("Track your symptoms and meals to identify patterns");
    }

    setSuggestions(newSuggestions);
  }

  return (
    <View style={styles.bg}>
      <View style={[styles.topSafeArea, { height: insets.top }]} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color={Colors.neutral.textDark} />
        </TouchableOpacity>
        <Text style={styles.h1}>Symptom Log</Text>
        <View style={styles.backButton} />
      </View>
    <ScrollView contentContainerStyle={styles.page}>

      <View style={styles.card}>
        <Text style={styles.h2}>How severe? (1-10)</Text>
        <TextInput style={styles.input} placeholder="e.g., 5" placeholderTextColor={Colors.neutral.mutedGray} value={severity} onChangeText={setSeverity} inputAccessoryViewID={KEYBOARD_DISMISS_ACCESSORY_ID} keyboardType="numeric" />
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Physical symptoms</Text>
        <Text style={styles.hint}>tap to select</Text>
        <View style={styles.chipsWrap}>
          {PHYSICAL_SYMPTOMS.map(item => {
            const active = physicalSymptoms.includes(item);
            return (
              <Pressable key={item} onPress={() => toggleSymptom(physicalSymptoms, item, setPhysicalSymptoms)} style={active ? styles.chipActive : styles.chip}>
                <Text style={active ? styles.chipTextActive : styles.chipText}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Mental symptoms</Text>
        <Text style={styles.hint}>tap to select</Text>
        <View style={styles.chipsWrap}>
          {MENTAL_SYMPTOMS.map(item => {
            const active = mentalSymptoms.includes(item);
            return (
              <Pressable key={item} onPress={() => toggleSymptom(mentalSymptoms, item, setMentalSymptoms)} style={active ? styles.chipActive : styles.chip}>
                <Text style={active ? styles.chipTextActive : styles.chipText}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.btnRow}>
        <Pressable style={[styles.btn, styles.btnSecondary]} onPress={showSuggestions}>
          <Text style={styles.btnTextSecondary}>Get suggestions</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={saveSymptoms}>
          <Text style={styles.btnText}>Save symptoms</Text>
        </Pressable>
      </View>

      {suggestions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.h2}>Food suggestions</Text>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
      <KeyboardDismissAccessory />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.neutral.backgroundLight },
  topSafeArea: { backgroundColor: "#000000" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.neutral.cardSurface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  backButton: { width: 36, alignItems: "center" },
  page: { padding: 16, gap: 16 },
  h1: { fontSize: 22, fontWeight: "800", color: Colors.neutral.textDark },
  h2: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: Colors.neutral.textDark },
  hint: { fontSize: 12, color: Colors.neutral.mutedGray, marginBottom: 8 },
  card: { backgroundColor: Colors.neutral.cardSurface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#EDEDED" },
  input: { borderWidth: 1, borderColor: Colors.neutral.mutedGray, borderRadius: 10, padding: 12, backgroundColor: Colors.neutral.cardSurface, color: Colors.neutral.textDark, marginTop: 8 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: Colors.neutral.mutedGray, backgroundColor: Colors.neutral.cardSurface },
  chipActive: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, backgroundColor: Colors.primary.green, borderColor: Colors.primary.green },
  chipText: { color: Colors.neutral.textDark, fontWeight: "600", lineHeight: 20 },
  chipTextActive: { color: "#fff", fontWeight: "600", lineHeight: 20 },
  btnRow: { flexDirection: "row", gap: 12 },
  btn: { flex: 1, backgroundColor: Colors.primary.green, padding: 14, borderRadius: 12, alignItems: "center" },
  btnSecondary: { backgroundColor: Colors.neutral.cardSurface, borderWidth: 1, borderColor: Colors.neutral.mutedGray },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  btnTextSecondary: { color: Colors.neutral.textDark, fontWeight: "700", fontSize: 16 },
  suggestionItem: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#EDEDED" },
  suggestionText: { color: Colors.neutral.textDark, fontSize: 14, lineHeight: 20 }
});
