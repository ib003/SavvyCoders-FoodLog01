import { auth } from "@/app/lib/auth";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { API_BASE } from "@/app/constants/api";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    (async () => {
      const isAuth = await auth.isAuthenticated();
      if (isAuth) {
        router.replace("/(tabs)/Dashboard");
      }
    })();
  }, []);

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const result = await auth.register(email.trim(), password);
      if (result.token) {
        Alert.alert(
          "Success!",
          "Your account has been created successfully.",
          [
            {
              text: "Get Started",
              onPress: () => router.replace("/(tabs)/Dashboard"),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.message || "Unable to create account. Please try again.";
      Alert.alert(
        "Registration Failed",
        errorMessage,
        [
          { text: "OK", style: "default" },
          ...(errorMessage.includes("connect") ? [
            { 
              text: "Check Server", 
              onPress: () => {
                Alert.alert(
                  "Server Connection",
                  `Make sure your server is running at:\n\n${API_BASE}\n\nAnd your device is on the same network.`,
                );
              }
            }
          ] : [])
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    Alert.alert("OAuth Coming Soon", `${provider === "google" ? "Google" : "Apple"} sign-in will be available soon.`);
    // TODO: Implement OAuth when expo-auth-session is configured
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
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
                placeholder="Create a password"
                placeholderTextColor={Colors.neutral.mutedGray}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <FontAwesome
                  name={showPassword ? "eye-slash" : "eye"}
                  size={20}
                  color={Colors.neutral.mutedGray}
                />
              </Pressable>
            </View>
            <Text style={styles.hint}>Must be at least 6 characters</Text>
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
              <Pressable
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FontAwesome
                  name={showConfirmPassword ? "eye-slash" : "eye"}
                  size={20}
                  color={Colors.neutral.mutedGray}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
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
            style={styles.oauthButton}
            onPress={() => handleOAuth("google")}
            disabled={loading}
          >
            <FontAwesome name="google" size={20} color={Colors.neutral.textDark} />
            <Text style={styles.oauthButtonText}>Continue with Google</Text>
          </Pressable>

          {Platform.OS === "ios" && (
            <Pressable
              style={styles.oauthButton}
              onPress={() => handleOAuth("apple")}
              disabled={loading}
            >
              <FontAwesome name="apple" size={20} color={Colors.neutral.textDark} />
              <Text style={styles.oauthButtonText}>Continue with Apple</Text>
            </Pressable>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.back()} disabled={loading}>
              <Text style={styles.footerLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.neutral.mutedGray,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutral.textDark,
  },
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
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: Colors.neutral.textDark,
  },
  eyeIcon: {
    padding: 16,
  },
  hint: {
    fontSize: 12,
    color: Colors.neutral.mutedGray,
    marginTop: -4,
  },
  primaryButton: {
    backgroundColor: Colors.primary.green,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.neutral.mutedGray,
    fontWeight: "500",
  },
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
  oauthButtonText: {
    color: Colors.neutral.textDark,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: Colors.neutral.mutedGray,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary.green,
    fontWeight: "600",
  },
});

