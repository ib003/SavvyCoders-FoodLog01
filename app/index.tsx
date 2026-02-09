import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { GradientScreen } from "@/components/ui/GradientScreen";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { TextField } from "@/components/ui/TextField";
import { Theme } from "@/constants/Theme";
import { API_BASE } from "@/src/constants/api";
import { auth } from "@/src/lib/auth";
import { signInWithApple, signInWithGoogle } from "@/src/lib/oauth";
import { useFadeIn, useScaleIn, useSlideInY } from "@/src/ui/animations";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animations
  const heroOpacity = useFadeIn(500, 100);
  const heroSlide = useSlideInY(30, 500, 100);
  const formScale = useScaleIn(400, 300);
  const button1Opacity = useFadeIn(300, 500);
  const button2Opacity = useFadeIn(300, 600);
  const button3Opacity = useFadeIn(300, 700);

  // Single auth redirect guard: if token exists -> go to tabs, else stay on login
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    (async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 400));
        if (!mounted) return;
        
        const token = await auth.getToken();
        console.log("[Login] Auth guard check:", token ? `Token exists (length: ${token.length})` : "No token");
        
        if (mounted && token && typeof token === 'string' && token.length >= 20) {
          console.log("[Login] Valid token found, redirecting to /(tabs)/Dashboard");
          timeoutId = setTimeout(() => {
            if (mounted) {
              router.replace("/(tabs)/Dashboard");
            }
          }, 100);
        } else {
          console.log("[Login] No valid token, staying on login screen (/)");
        }
      } catch (error) {
        console.error("[Login] Auth guard error:", error);
      }
    })();
    
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Information", "Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await auth.login(email.trim(), password);
      if (result.token) {
        setTimeout(() => {
          router.replace("/(tabs)/Dashboard");
        }, 100);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.message || "Unable to sign in. Please check your credentials and try again.";
      Alert.alert(
        "Login Failed",
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
    setLoading(true);
    try {
      console.log(`[Login] Starting ${provider} OAuth...`);
      
      const result = provider === "google" 
        ? await signInWithGoogle()
        : await signInWithApple();
      
      console.log(`[Login] ${provider} OAuth result:`, result.success ? "Success" : "Failed", result.error || "");
      
      if (result.success && result.token) {
        console.log(`[Login] ${provider} sign-in successful, navigating to dashboard...`);
        setTimeout(() => {
          router.replace("/(tabs)/Dashboard");
        }, 100);
      } else {
        const errorMessage = result.error || `${provider === "google" ? "Google" : "Apple"} sign-in failed. Please try again.`;
        console.error(`[Login] ${provider} OAuth failed:`, errorMessage);
        Alert.alert(
          "Sign In Failed",
          errorMessage
        );
      }
    } catch (error: any) {
      console.error(`[Login] ${provider} OAuth unexpected error:`, error);
      Alert.alert(
        "Sign In Failed",
        `Failed to sign in with ${provider === "google" ? "Google" : "Apple"}. ${error.message || "Please try again."}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkipLoginDev = () => {
    (auth as any).getToken = async () => "dev-demo-token-12345678901234567890";
    (auth as any).isAuthenticated = async () => true;

    router.replace("/(tabs)/Dashboard");
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
              <FontAwesome name="leaf" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.heroTitle}>SavvyTrack</Text>
            <Text style={styles.heroSubtitle}>Your personal food & health companion</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            style={{
              transform: [{ scale: formScale.scale }],
              opacity: formScale.opacity,
            }}
          >
            <Card style={styles.formCard} padding="2xl" variant="elevated">
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue your journey</Text>

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
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                icon="lock"
                editable={!loading}
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

              <Animated.View style={{ opacity: button1Opacity }}>
                <PrimaryButton
                  title="Sign In"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  style={styles.signInButton}
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

              <Pressable
                onPress={handleSkipLoginDev}
                disabled={loading}
                style={{ marginTop: Theme.spacing.md, alignItems: "center" }}
              >
                <Text
                  style={{
                    ...Theme.typography.captionSmall,
                    color: Theme.colors.text.secondary,
                    textDecorationLine: "underline",
                  }}
                >
                  Skip login for demo
                </Text>
              </Pressable>

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
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Pressable onPress={() => router.push("/register")} disabled={loading}>
                  <Text style={styles.footerLink}>Sign Up</Text>
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
  signInButton: {
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
