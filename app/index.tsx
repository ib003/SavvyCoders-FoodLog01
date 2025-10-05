import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

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
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 14 },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center" },
  subtitle: { textAlign: "center", opacity: 0.7, marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12
  },
  btn: {
    backgroundColor: "#3b82f6", padding: 14, borderRadius: 12, alignItems: "center"
  },
  btnText: { color: "white", fontWeight: "700" },
  hint: { fontSize: 12, textAlign: "center", opacity: 0.6, marginTop: 4 },
});
