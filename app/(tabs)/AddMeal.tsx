import { Href, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
        <Option label="Photo Log" to="/add/photo" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: "#FAFAFA" },
  title: { fontSize: 28, fontWeight: "800", color: "#2E2E2E" },
  sub: { marginTop: 4, color: "#A6A6A6" },
  item: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#EDEDED" },
  itemText: { fontSize: 16, fontWeight: "700", color: "#2E2E2E" },
});
