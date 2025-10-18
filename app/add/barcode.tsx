import { View, Text } from "react-native";

export default function AddBarcode() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "800" }}>Barcode Scan (Mock)</Text>
      <Text style={{ marginTop: 8 }}>
        TODO: integrate expo-barcode-scanner and allergen check.
      </Text>
    </View>
  );
}
