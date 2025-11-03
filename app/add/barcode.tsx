import { Text, View } from "react-native";

export default function AddBarcode() {
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#FAFAFA" }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#2E2E2E" }}>Barcode Scan (Mock)</Text>
      <Text style={{ marginTop: 8, color: "#A6A6A6" }}>
        TODO: integrate expo-barcode-scanner and allergen check.
      </Text>
    </View>
  );
}
