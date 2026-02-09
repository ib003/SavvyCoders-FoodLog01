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

export default function Register() {
  const router = useRouter();

  // typed so trim() never goes red
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Google OAuth IDs
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

  const [googleRequest, googleResponse, promptGoogle] =
    Google.useIdTokenAuthRequest({
      iosClientId: iosClientId || undefined,
      webClientId: webClientId || undefined,
    });

  // handle google response
  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type !== "success") return;

    const idToken = googleResponse.params?.id_token;
    if (!idToken) {
      Alert.alert("Google Sign-In Failed", "No ID token was returned.");
      return;
    }

    handleGoogleRegister(idToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  const clearSession = async () => {
    try {
      await auth.clear();
      Alert.alert("Cleared", "Saved login cleared. You can sign up with a new email now.");
    } catch (e: any) {
      console.error("Clear session error:", e);
      Alert.alert("Error", e?.message || "Failed to clear saved session.");
    }
  };

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await auth.register(cleanEmail, password, cleanName);

      if (result?.token) {
        Alert.alert("Success!", "Your account has been created successfully.", [
          { text: "Get Started", onPress: () => router.replace("/(tabs)/Dashboard") },
        ]);
      } else {
        Alert.alert("Registration Failed", "No token returned from server.");
      }
    } catch (error: any) {
      console.error("Registration error:", error);

      const errorMessage = error?.message || "Unable to create account. Please try again.";

      Alert.alert("Registration Failed", errorMessage, [
        { text: "OK", style: "default" },
        ...(String(errorMessage).toLowerCase().includes("connect")
          ? [
              {
                text: "Check Server",
                onPress: () => {
                  Alert.alert(
                    "Server Connection",
                    `Make sure your server is running at:\n\n${API_BASE}\n\nAnd your device is on the same Wi-Fi as your Mac.`
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

  const handleGoogleRegister = async (idToken: string) => {
    if (!iosClientId || !webClientId) {
      Alert.alert(
        "Google Sign-In Not Configured",
        "Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID or EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your Expo .env."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          name: name.trim() || undefined,
        }),
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
      console.error("Google registration error:", error);
      Alert.alert("Google Sign-In Failed", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onPressGoogle = async () => {
    if (!iosClientId || !webClientId) {
      Alert.alert(
        "Google Sign-In Not Configured",
        "Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID to your Expo .env and restart the app."
      );
      return;
    }

    try {
      await promptGoogle({ useProxy: true } as any);
    } catch (e: any) {
      Alert.alert("Google Sign-In Failed", e?.message || "Please try again.");
    }
  };

  // ✅ disable create account until valid
  const disableCreate =
    loading ||
    !name.trim() ||
    !email.trim() ||
    !password ||
    !confirmPassword ||
    password !== confirmPassword;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.neutral.mutedGray}
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

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
                placeholder="Create a password"
                placeholderTextColor={Colors.neutral.mutedGray}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <Pressable style={styles.eyeIcon} onPress={() => setShowPassword((v) => !v)}>
                <FontAwesome
                  name={showPassword ? "eye-slash" : "eye"}
                  size={20}
                  color={Colors.neutral.mutedGray}
                />
              </Pressable>
            </View>
            <Text style={styles.hint}>Must be at least 8 characters</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your password"
                placeholderTextColor={Colors.neutral.mutedGray}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
              <Pressable style={styles.eyeIcon} onPress={() => setShowConfirmPassword((v) => !v)}>
                <FontAwesome
                  name={showConfirmPassword ? "eye-slash" : "eye"}
                  size={20}
                  color={Colors.neutral.mutedGray}
                />
              </Pressable>
            </View>
          </View>

          {/* ✅ Correct Create Account button */}
          <Pressable
            style={[
              styles.primaryButton,
              disableCreate && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={disableCreate}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={[
              styles.oauthButton,
              (loading || !googleRequest) && styles.buttonDisabled,
            ]}
            onPress={onPressGoogle}
            disabled={loading || !googleRequest}
          >
            <FontAwesome name="google" size={20} color={Colors.neutral.textDark} />
            <Text style={styles.oauthButtonText}>Continue with Google</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.replace("/(auth)")} disabled={loading}>
              <Text style={styles.footerLink}>Sign In</Text>
            </Pressable>
          </View>

          <Pressable onPress={clearSession} disabled={loading} style={styles.clearSessionBtn}>
            <Text style={styles.clearSessionText}>Clear saved login (switch account)</Text>
          </Pressable>
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
  hint: { fontSize: 12, color: Colors.neutral.mutedGray, marginTop: -4 },
  primaryButton: {
    backgroundColor: Colors.primary.green,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
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
  clearSessionBtn: { marginTop: 4, alignItems: "center", paddingVertical: 8 },
  clearSessionText: {
    fontSize: 13,
    color: Colors.neutral.mutedGray,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});