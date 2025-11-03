import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function Symptom() {
  const [whenStarted, setWhenStarted] = useState("");
  const [severity, setSeverity] = useState("");

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
  btn: {
    backgroundColor: "#5DBB63",
    padding: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 }
});