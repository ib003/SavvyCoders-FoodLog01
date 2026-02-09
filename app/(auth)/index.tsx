// app/(auth)/index.tsx
import { API_BASE } from "@/constants/api";
import { Colors } from "@/constants/Colors";
import { auth } from "@/lib/auth";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function AuthIndexLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const cleanEmail = useMemo(() => email.trim(), [email]);

  // Google client ids (optional)
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

  const [googleRequest, googleResponse, promptGoogle] =
    Google.useIdTokenAuthRequest({
      iosClientId: iosClientId || undefined,
      webClientId: webClientId || undefined,
    });

  // ✅ Always clickable: validate on press
  const handleLogin = async () => {
    if (loading) return;

    if (!cleanEmail || !password) {
      Alert.alert("Missing Information", "Please enter both email and password.");
      return;
    }

    // basic email format check (helps avoid dumb typos)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      console.log("API_BASE:", API_BASE);

      const result = await auth.login(cleanEmail, password);

      if (!result?.token) {
        Alert.alert("Login Failed", "No token returned from server.");
        return;
      }

      // ✅ go into tabs group (tabs guard will handle token validity)
      router.replace("/(tabs)");
    } catch (error: any) {
      const msg = error?.message ?? "Invalid credentials.";
      Alert.alert("Login Failed", msg, [
        { text: "OK" },
        ...(String(msg).toLowerCase().includes("connect") ||
        String(msg).toLowerCase().includes("timeout")
          ? [
              {
                text: "Server Help",
                onPress: () =>
                  Alert.alert(
                    "Server Connection",
                    `Make sure your server is running at:\n\n${API_BASE}\n\nSame Wi-Fi on phone + laptop.`
                  ),
              },
            ]
          : []),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || data?.message || "Google sign-in failed.");
      if (!data?.token) throw new Error("No token returned from server.");

      await auth.saveToken(data.token);
      if (data?.user?.email) await auth.saveUserEmail(data.user.email);

      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Google Sign-In Failed", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type !== "success") return;

    const idToken = (googleResponse as any).params?.id_token;
    if (!idToken) {
      Alert.alert("Google Sign-In Failed", "No ID token returned.");
      return;
    }

    handleGoogleLogin(idToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  const onPressGoogle = async () => {
    if (loading) return;

    if (!iosClientId && !webClientId) {
      Alert.alert(
        "Google Sign-In Not Configured",
        "Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and/or EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your Expo .env, then restart Expo with -c."
      );
      return;
    }

    try {
      await promptGoogle({ useProxy: true } as any);
    } catch (e: any) {
      Alert.alert("Google Sign-In Failed", e?.message ?? "Please try again.");
    }
  };

  const goRegister = () => {
    if (loading) return;
    router.push("/(auth)/register");
  };

  const clearSession = async () => {
    if (loading) return;
    await auth.logout();
    Alert.alert("Cleared", "Saved token cleared. Now sign in again.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>SavvyTrack</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Colors.neutral.mutedGray}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor={Colors.neutral.mutedGray}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowPassword((v) => !v)}
                disabled={loading}
              >
                <FontAwesome
                  name={showPassword ? "eye-slash" : "eye"}
                  size={20}
                  color={Colors.neutral.mutedGray}
                />
              </Pressable>
            </View>
          </View>

          {/* ✅ SIGN IN */}
          <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ✅ GOOGLE */}
          <Pressable
            style={[styles.oauthButton, (loading || !googleRequest) && styles.buttonDisabled]}
            onPress={onPressGoogle}
            disabled={loading || !googleRequest}
          >
            <FontAwesome name="google" size={20} color={Colors.neutral.textDark} />
            <Text style={styles.oauthButtonText}>Continue with Google</Text>
          </Pressable>

          {/* ✅ CREATE ACCOUNT */}
          <Pressable
            style={[styles.secondaryButton, loading && styles.buttonDisabled]}
            onPress={goRegister}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Create New Account</Text>
          </Pressable>

          {/* Optional helper */}
          <Pressable onPress={clearSession} disabled={loading} style={{ marginTop: 6 }}>
            <Text style={styles.clearText}>Clear saved session</Text>
          </Pressable>

          <Text style={styles.hint}>Server: {API_BASE}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.backgroundLight },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontSize: 36, fontWeight: "800", color: Colors.neutral.textDark, marginBottom: 6 },
  subtitle: { fontSize: 16, color: Colors.neutral.mutedGray },

  form: { gap: 14 },
  inputContainer: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.neutral.textDark },

  input: {
    backgroundColor: Colors.neutral.cardSurface,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.neutral.textDark,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.cardSurface,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: Colors.neutral.textDark },
  eyeIcon: { padding: 16 },

  primaryButton: {
    backgroundColor: Colors.primary.green,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
  dividerText: { marginHorizontal: 16, fontSize: 14, color: Colors.neutral.mutedGray, fontWeight: "500" },

  oauthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutral.cardSurface,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  oauthButtonText: { color: Colors.neutral.textDark, fontSize: 16, fontWeight: "600" },

  secondaryButton: {
    borderWidth: 2,
    borderColor: Colors.primary.green,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: Colors.primary.green, fontSize: 15, fontWeight: "700" },

  buttonDisabled: { opacity: 0.45 },

  clearText: {
    textAlign: "center",
    color: Colors.primary.green,
    fontWeight: "700",
  },

  hint: { textAlign: "center", marginTop: 10, color: Colors.neutral.mutedGray, fontSize: 12 },
});