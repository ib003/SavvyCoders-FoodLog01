import { View, Text } from "react-native";

export default function AddSearch() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "800" }}>Search Meals (Mock)</Text>
      <Text style={{ marginTop: 8 }}>
        TODO: Add a search input and results list. Tap a result to add to log.
      </Text>
    </View>
  );
}
