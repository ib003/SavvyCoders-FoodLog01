import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function AllergenWarning() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>
        Alerts
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 20 }}>
        Allergen warnings will show here when a meal conflicts with your saved preferences.
      </Text>

      <Pressable
        onPress={() => router.back()}
        style={{ padding: 12, borderRadius: 10, backgroundColor: "#ddd" }}
      >
        <Text style={{ textAlign: "center", fontWeight: "600" }}>Back</Text>
      </Pressable>
    </View>
  );
}