import { API_BASE } from "@/constants/api";
import { Colors } from "@/constants/Colors";
import { auth } from "@/lib/auth";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function Login() {
  const router = useRouter();

  // ✅ type these so trim() never turns red
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // ✅ IMPORTANT: turn this OFF or you will "auto-login" forever
  const DEV_MODE = false;

  // ---- Google OAuth IDs (from Expo root .env) ----
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

  const [googleRequest, googleResponse, promptGoogle] =
    Google.useIdTokenAuthRequest({
      iosClientId: iosClientId || undefined,
      webClientId: webClientId || undefined,
    });

  // ✅ If already logged in, jump straight to tabs
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (DEV_MODE) return; // don't auto-redirect in dev bypass mode

        const token = await auth.getToken();
        if (!mounted) return;

        if (token && typeof token === "string" && token.length >= 10) {
          router.replace("/(tabs)/Dashboard");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ✅ Clears saved session then goes to Register
  const startNewAccount = async () => {
    try {
      setLoading(true);
      await auth.clear(); // you DO have this
    } catch (e) {
      console.warn("Failed to clear auth session:", e);
    } finally {
      setLoading(false);
      router.replace("/(auth)/register");
    }
  };

  const handleLogin = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert("Missing Information", "Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await auth.login(cleanEmail, password);
      if (result?.token) {
        router.replace("/(tabs)/Dashboard");
      } else {
        Alert.alert("Login Failed", "No token returned from server.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error?.message || "Unable to sign in. Please check your credentials and try again.";

      Alert.alert("Login Failed", errorMessage, [
        { text: "OK", style: "default" },
        ...(String(errorMessage).toLowerCase().includes("connect")
          ? [
              {
                text: "Check Server",
                onPress: () => {
                  Alert.alert(
                    "Server Connection",
                    `Make sure your server is running at:\n\n${API_BASE}\n\nAnd your device is on the same network.`
                  );
                },
              },
            ]
          : []),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Google sign-in failed.");
      }

      if (!data?.token) {
        throw new Error("No token returned from server.");
      }

      Alert.alert("Welcome!", "Signed in with Google successfully.", [
        { text: "Continue", onPress: () => router.replace("/(tabs)/Dashboard") },
      ]);
    } catch (error: any) {
      console.error("Google login error:", error);
      Alert.alert("Google Sign-In Failed", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google response
  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type !== "success") return;

    const idToken = googleResponse.params?.id_token;

    if (!idToken) {
      Alert.alert("Google Sign-In Failed", "No ID token was returned.");
      return;
    }

    handleGoogleLogin(idToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  const onPressGoogle = async () => {
    if (!iosClientId || !webClientId) {
      Alert.alert(
        "Google Sign-In Not Configured",
        "Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID or EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your Expo .env. Restart Expo after adding them."
      );
      return;
    }

    try {
      await promptGoogle({ useProxy: true } as any);
    } catch (e: any) {
      Alert.alert("Google Sign-In Failed", e?.message || "Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
              autoComplete="email"
              keyboardType="email-address"
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
              <Pressable style={styles.eyeIcon} onPress={() => setShowPassword((v) => !v)}>
                <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color={Colors.neutral.mutedGray} />
              </Pressable>
            </View>
          </View>

          <Pressable style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={[styles.oauthButton, (loading || !googleRequest) && styles.buttonDisabled]}
            onPress={onPressGoogle}
            disabled={loading || !googleRequest}
          >
            <FontAwesome name="google" size={20} color={Colors.neutral.textDark} />
            <Text style={styles.oauthButtonText}>Continue with Google</Text>
          </Pressable>

          {/* ✅ Correct Sign Up route */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <Pressable onPress={startNewAccount} disabled={loading}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.backgroundLight },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 36, fontWeight: "800", color: Colors.neutral.textDark, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.neutral.mutedGray },
  form: { gap: 20 },
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
  primaryButton: { backgroundColor: Colors.primary.green, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
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
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  footerText: { fontSize: 14, color: Colors.neutral.mutedGray },
  footerLink: { fontSize: 14, color: Colors.primary.green, fontWeight: "600" },
});