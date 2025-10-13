import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen()
{
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Dashboard</Text>

      <View style={styles.section}>
        <Text style={styles.h2}>Quick Actions</Text>
        <View style={styles.row}>
          <View style={[styles.btn, styles.btnPrimary]}>
            <Text style={styles.btnText}>+ Add Meal</Text>
          </View>
          <View style={[styles.btn, styles.btnSecondary]}>
            <Text style={[styles.btnText, styles.btnTextDark]}>History</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Your Allergens</Text>
        <View style={styles.chips} />
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Recent Meals</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Warnings</Text>
      </View>
    </ScrollView>
  );
}

let styles = StyleSheet.create(
{
  page: { padding: 16, gap: 16 },
  h1: { fontSize: 28, fontWeight: "800" },
  h2: { fontSize: 18, fontWeight: "700", marginBottom: 6 },

  section: { gap: 8 },
  row: { flexDirection: "row", gap: 12 },

  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  btnPrimary: { backgroundColor: "#1e90ff", borderColor: "#1e90ff" },
  btnSecondary: { backgroundColor: "#fff", borderColor: "#c8d1dc" },
  btnText: { color: "#fff", fontWeight: "700" },
  btnTextDark: { color: "#0f172a" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  chipOff: { backgroundColor: "#fff", borderColor: "#cbd5e1" },
  chipOn: { backgroundColor: "#fde68a", borderColor: "#f59e0b" },
  chipText: { color: "#0f172a" },
  chipTextOn: { color: "#7c2d12", fontWeight: "700" },

  hint: { color: "#475569", fontSize: 12 },

  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 8 },
  cardWarn: { borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.2)" },

  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSub: { color: "#475569", marginTop: 4 },
  ok: { color: "#16a34a", fontWeight: "700" }
});
