import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function AllergenWarning() {
  const router = useRouter();
  const { message } = useLocalSearchParams<{ message?: string }>();

  return (
    <View style={{ flex: 1, padding: 18, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>
        Allergen Warning
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 18 }}>
        {message ?? "This meal may contain one of your selected allergens."}
      </Text>

      <Pressable
        onPress={() => router.back()}
        style={{ padding: 12, borderRadius: 10, backgroundColor: "#ddd" }}
      >
        <Text style={{ textAlign: "center", fontWeight: "600" }}>Go back</Text>
      </Pressable>
    </View>
  );
}