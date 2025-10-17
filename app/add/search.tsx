import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

type Food = { id: string; name: string; tags: string[] };

// mock catalog (add more as you like)
const CATALOG: Food[] = [
  { id: "1", name: "Chicken Bowl", tags: ["Gluten-Free", "High-Protein"] },
  { id: "2", name: "PB&J Sandwich", tags: ["Peanuts"] },
  { id: "3", name: "Greek Yogurt + Berries", tags: ["Dairy"] },
  { id: "4", name: "Veggie Salad", tags: ["Vegan", "Gluten-Free"] },
  { id: "5", name: "Oatmeal", tags: ["Vegetarian"] },
  { id: "6", name: "Almond Butter Toast", tags: ["Tree Nuts"] },
];

export default function AddSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return CATALOG;
    return CATALOG.filter(
      f =>
        f.name.toLowerCase().includes(needle) ||
        f.tags.some(t => t.toLowerCase().includes(needle))
    );
  }, [q]);

  function handleAdd(food: Food) {
    // (Mock) confirm add; later you can persist to AsyncStorage or backend
    Alert.alert(
      "Added!",
      `${food.name} was added to today's log.`,
      [
        { text: "OK", onPress: () => router.back() } // go back to Add Meal tab
      ]
    );
  }

  const Row = ({ item }: { item: Food }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>Tags: {item.tags.join(", ") || "None"}</Text>
      </View>
      <Pressable style={styles.addBtn} onPress={() => handleAdd(item)}>
        <Text style={styles.addTxt}>Add</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search meals or tags (e.g., gluten, peanuts)"
        style={styles.input}
        autoFocus
      />
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={Row}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No matches. Try another term.</Text>
        }
        contentContainerStyle={{ paddingVertical: 8 }}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  name: { fontSize: 16, fontWeight: "700" },
  sub: { color: "#475569", marginTop: 4 },
  addBtn: {
    backgroundColor: "#1e90ff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addTxt: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", color: "#64748b", marginTop: 16 },
});
