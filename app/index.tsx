import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  // If already logged in, jump straight to tabs
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) router.replace("/(tabs)/Dashboard");
    })();
  }, []);

  const onLogin = async () => {
    // super simple “mock” auth for Sprint 1
    if (!email || !pwd) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }
    await AsyncStorage.setItem("auth_token", "demo-token");
    await AsyncStorage.setItem("user_email", email.trim());
    router.replace("/(tabs)/Dashboard");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SavvyTrack</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={pwd}
        onChangeText={setPwd}
      />

      <Pressable style={styles.btn} onPress={onLogin}>
        <Text style={styles.btnText}>Login</Text>
      </Pressable>

      <Text style={styles.hint}>Sprint 1 uses mock auth. Real API hooks in Sprint 2.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 14, backgroundColor: "#FAFAFA" },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center", color: "#2E2E2E" },
  subtitle: { textAlign: "center", color: "#A6A6A6", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#A6A6A6", borderRadius: 12, padding: 12, backgroundColor: "#FFFFFF", color: "#2E2E2E" },
  btn: { backgroundColor: "#5DBB63", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "white", fontWeight: "700" },
  hint: { fontSize: 12, textAlign: "center", color: "#A6A6A6", marginTop: 4 },
});
