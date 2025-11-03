import { Text, View } from "react-native";

export default function AddSearch() {
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#FAFAFA" }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#2E2E2E" }}>Search Meals (Mock)</Text>
      <Text style={{ marginTop: 8, color: "#A6A6A6" }}>
        TODO: Add a search input and results list. Tap a result to add to log.
      </Text>
    </View>
  );
}
