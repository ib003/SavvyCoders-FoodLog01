import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

export default function DashboardScreen()
{
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Dashboard</Text>
    </ScrollView>
  );
}

let styles = StyleSheet.create(
{
  page: { padding: 16, gap: 16 },
  h1: { fontSize: 28, fontWeight: "800" }
});