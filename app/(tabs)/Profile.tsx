import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("user_email");
      setEmail(saved);
    })();
  }, []);

  const onLogout = async () => {
    await AsyncStorage.multiRemove(["auth_token", "user_email"]);
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email ?? "demo@savvytrack.app"}</Text>
      </View>

      <Pressable style={styles.btn} onPress={onLogout}>
        <Text style={styles.btnText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: "800" },
  card: {
    borderWidth: 1, borderColor: "#eee", borderRadius: 14, padding: 16
  },
  label: { fontSize: 12, opacity: 0.6 },
  value: { fontSize: 16, fontWeight: "600", marginTop: 4 },
  btn: { backgroundColor: "#d17575ff", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "white", fontWeight: "700" },
});
