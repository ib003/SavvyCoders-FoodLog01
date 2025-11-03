import { Text, View } from "react-native";

export default function AddSaved() {
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#FAFAFA" }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#2E2E2E" }}>Saved Items (Mock)</Text>
      <Text style={{ marginTop: 8, color: "#A6A6A6" }}>
        TODO: Show user’s saved meals with quick add buttons.
      </Text>
    </View>
  );
}
