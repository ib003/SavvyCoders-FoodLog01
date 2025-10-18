import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, Href } from "expo-router";

export default function AddMealTab() {
  const router = useRouter();

  const Option = ({ label, to }: { label: string; to: Href }) => (
    <Pressable style={styles.item} onPress={() => router.push(to)}>
      <Text style={styles.itemText}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Add Meal</Text>
      <Text style={styles.sub}>Choose how you want to log it:</Text>

      <View style={{ gap: 10, marginTop: 12 }}>
        <Option label="Search" to="/add/search" />
        <Option label="Pick from Saved Items" to="/add/saved" />
        <Option label="Barcode Scan" to="/add/barcode" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: "800" },
  sub: { marginTop: 4, color: "#475569" },
  item: { backgroundColor: "#f5f5f7", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  itemText: { fontSize: 16, fontWeight: "700" },
});
