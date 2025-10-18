import { View, Text } from "react-native";

export default function AddSaved() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "800" }}>Saved Items (Mock)</Text>
      <Text style={{ marginTop: 8 }}>
        TODO: Show user’s saved meals with quick add buttons.
      </Text>
    </View>
  );
}
