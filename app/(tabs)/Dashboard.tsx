import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen()
{
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Dashboard</Text>

      <View style={styles.section}>
        <Text style={styles.h2}>Quick Actions</Text>
        <View style={styles.row} />
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Your Allergens</Text>
        <View />
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Recent Meals</Text>
        <View />
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Warnings</Text>
        <View />
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
  row: { flexDirection: "row", gap: 12 }
});