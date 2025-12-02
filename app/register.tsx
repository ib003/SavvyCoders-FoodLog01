import { auth } from "@/src/lib/auth";
import { signInWithGoogle, signInWithApple } from "@/src/lib/oauth";
import { useFadeIn, useScaleIn, useSlideInY } from "@/src/ui/animations";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Animated, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { API_BASE } from "@/src/constants/api";
import { Theme } from "@/constants/Theme";
import { GradientScreen } from "@/components/ui/GradientScreen";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { TextField } from "@/components/ui/TextField";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { LinearGradient } from "expo-linear-gradient";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Animations
  const heroOpacity = useFadeIn(500, 100);
  const heroSlide = useSlideInY(30, 500, 100);
  const formScale = useScaleIn(400, 300);
  const button1Opacity = useFadeIn(300, 500);
  const button2Opacity = useFadeIn(300, 600);
  const button3Opacity = useFadeIn(300, 700);

  const validatePassword = (pwd: string) => {
    if (pwd.length > 0 && pwd.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirm: string) => {
    if (confirm.length > 0 && confirm !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters long.");
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
          "Your account has been created successfully. You are now signed in.",
          [
            {
              text: "Get Started",
              onPress: () => {
                router.replace("/(tabs)/Dashboard");
              },
            },
          ]
        );
        setTimeout(() => {
          router.replace("/(tabs)/Dashboard");
        }, 2000);
      } else {
        throw new Error("No token received from server");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = error.message || "Unable to create account. Please try again.";
      
      if (errorMessage.includes("at least 8 characters")) {
        errorMessage = "Password must be at least 8 characters long.";
      } else if (errorMessage.includes("already exists") || errorMessage.includes("already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (errorMessage.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      }
      
      Alert.alert(
        "Registration Failed",
        errorMessage,
        [
          { text: "OK", style: "default" },
          ...(errorMessage.includes("connect") || errorMessage.includes("server") ? [
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
    setLoading(true);
    try {
      const result = provider === "google" 
        ? await signInWithGoogle()
        : await signInWithApple();
      
      if (result.success && result.token) {
        Alert.alert(
          "Success!",
          "You have been signed in successfully.",
          [
            {
              text: "Get Started",
              onPress: () => router.replace("/(tabs)/Dashboard"),
            },
          ]
        );
        setTimeout(() => {
          router.replace("/(tabs)/Dashboard");
        }, 2000);
      } else {
        Alert.alert(
          "Sign In Failed",
          result.error || `${provider === "google" ? "Google" : "Apple"} sign-in failed. Please try again.`
        );
      }
    } catch (error: any) {
      console.error("OAuth error:", error);
      Alert.alert(
        "Sign In Failed",
        `Failed to sign in with ${provider === "google" ? "Google" : "Apple"}. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientScreen>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: heroOpacity,
                transform: [
                  { translateY: heroSlide.translateY },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[Theme.colors.primary.gradient[0], Theme.colors.primary.gradient[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <FontAwesome name="user-plus" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.heroTitle}>Create Account</Text>
            <Text style={styles.heroSubtitle}>Join SavvyTrack and start tracking your health</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            style={{
              transform: [{ scale: formScale.scale }],
              opacity: formScale.opacity,
            }}
          >
            <Card style={styles.formCard} padding="2xl" variant="elevated">
            <Text style={styles.formTitle}>Get Started</Text>
            <Text style={styles.formSubtitle}>Fill in your details to create your account</Text>

            <View style={styles.formFields}>
              <TextField
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                icon="envelope"
                editable={!loading}
              />

              <TextField
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  validatePassword(text);
                  if (confirmPassword) validateConfirmPassword(confirmPassword);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                icon="lock"
                editable={!loading}
                error={passwordError}
                rightIcon={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <FontAwesome
                      name={showPassword ? "eye-slash" : "eye"}
                      size={18}
                      color={Theme.colors.text.tertiary}
                    />
                  </Pressable>
                }
              />
              {!passwordError && (
                <Text style={styles.hint}>Must be at least 8 characters</Text>
              )}

              <TextField
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  validateConfirmPassword(text);
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                icon="lock"
                editable={!loading}
                error={confirmPasswordError}
                rightIcon={
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <FontAwesome
                      name={showConfirmPassword ? "eye-slash" : "eye"}
                      size={18}
                      color={Theme.colors.text.tertiary}
                    />
                  </Pressable>
                }
              />

              <Animated.View style={{ opacity: button1Opacity }}>
                <PrimaryButton
                  title="Create Account"
                  onPress={handleRegister}
                  loading={loading}
                  disabled={loading}
                  style={styles.createButton}
                />
              </Animated.View>

              <Divider text="OR" />

              <Animated.View style={{ opacity: button2Opacity }}>
                <SecondaryButton
                  title="Continue with Google"
                  onPress={() => handleOAuth("google")}
                  disabled={loading}
                  icon={<FontAwesome name="google" size={18} color={Theme.colors.text.primary} />}
                  style={styles.oauthButton}
                />
              </Animated.View>

              {Platform.OS === "ios" && (
                <Animated.View style={{ opacity: button3Opacity }}>
                  <SecondaryButton
                    title="Continue with Apple"
                    onPress={() => handleOAuth("apple")}
                    disabled={loading}
                    icon={<FontAwesome name="apple" size={18} color={Theme.colors.text.primary} />}
                    style={styles.oauthButton}
                  />
                </Animated.View>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Pressable onPress={() => router.back()} disabled={loading}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </Pressable>
              </View>
            </View>
          </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Theme.spacing['4xl'],
    paddingBottom: Theme.spacing['2xl'],
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Theme.spacing['3xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: Theme.radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.button,
  },
  heroTitle: {
    ...Theme.typography.title,
    fontSize: 36,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  heroSubtitle: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  formCard: {
    marginHorizontal: Theme.spacing.lg,
  },
  formTitle: {
    ...Theme.typography.sectionTitle,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  formSubtitle: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing['2xl'],
  },
  formFields: {
    gap: Theme.spacing.md,
  },
  hint: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.text.tertiary,
    marginTop: -Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  createButton: {
    marginTop: Theme.spacing.sm,
  },
  oauthButton: {
    marginTop: Theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
  },
  footerText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
  },
  footerLink: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.primary.main,
    fontWeight: '600',
  },
});
