import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function Symptom() {
  const [physicalSymptoms, setPhysicalSymptoms] = useState<string[]>([]);
  const [mentalSymptoms, setMentalSymptoms] = useState<string[]>([]);
  const [whenStarted, setWhenStarted] = useState("");
  const [severity, setSeverity] = useState("");

  // list of food-related physical symptoms
  const PHYSICAL_SYMPTOMS = ["Bloating", "Stomach pain", "Gas", "Nausea", "Heartburn", "Indigestion", "Constipation", "Diarrhea", "Fatigue"];

  // list of food-related mental symptoms
  const MENTAL_SYMPTOMS = ["Brain fog", "Low energy", "Difficulty concentrating", "Mood swings", "Irritability"];

  // toggle symptom selection
  function toggleSymptom(current: string[], value: string, setter: (v: string[]) => void) {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Symptom Log</Text>

      <View style={styles.card}>
        <Text style={styles.h2}>When did symptoms start?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 2 hours after lunch"
          placeholderTextColor="#A6A6A6"
          value={whenStarted}
          onChangeText={setWhenStarted}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>How severe? (1-10)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 5"
          placeholderTextColor="#A6A6A6"
          value={severity}
          onChangeText={setSeverity}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Physical symptoms</Text>
        <Text style={styles.hint}>tap to select</Text>
        <View style={styles.chipsWrap}>
          {PHYSICAL_SYMPTOMS.map(item => {
            const active = physicalSymptoms.includes(item);
            return (
              <Pressable
                key={item}
                onPress={() => toggleSymptom(physicalSymptoms, item, setPhysicalSymptoms)}
                style={active ? styles.chipActive : styles.chip}
              >
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
              <Pressable
                key={item}
                onPress={() => toggleSymptom(mentalSymptoms, item, setMentalSymptoms)}
                style={active ? styles.chipActive : styles.chip}
              >
                <Text style={active ? styles.chipTextActive : styles.chipText}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.btn} onPress={() => {}}>
        <Text style={styles.btnText}>Get food suggestions</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: "#FAFAFA" },
  page: { padding: 16, gap: 16 },
  h1: { fontSize: 28, fontWeight: "800", color: "#2E2E2E" },
  h2: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#2E2E2E" },
  hint: { fontSize: 12, color: "#A6A6A6", marginBottom: 8 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EDEDED"
  },
  input: {
    borderWidth: 1,
    borderColor: "#A6A6A6",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FFFFFF",
    color: "#2E2E2E",
    marginTop: 8
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#A6A6A6",
    backgroundColor: "#FFFFFF"
  },
  chipActive: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#5DBB63",
    borderColor: "#5DBB63"
  },
  chipText: { color: "#2E2E2E", fontWeight: "600", lineHeight: 20 },
  chipTextActive: { color: "#fff", fontWeight: "600", lineHeight: 20 },
  btn: {
    backgroundColor: "#5DBB63",
    padding: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 }
});