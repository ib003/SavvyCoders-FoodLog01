import React from "react";
import { Text, View } from "react-native";

export default function AllergenWarning() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" }}>
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#2E2E2E" }}>Allergen Warning Screen</Text>
      <Text style={{ marginTop: 8, color: "#A6A6A6" }}>mock view</Text>
    </View>
  );
}
