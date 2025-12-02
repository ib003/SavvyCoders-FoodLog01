import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Theme } from "@/constants/Theme";
import { auth } from "@/src/lib/auth";
import { UserPreferences, preferences } from "@/src/lib/preferences";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({ allergies: [], dietaryPreferences: [] });

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const token = await auth.getToken();
      if (!token || typeof token !== 'string' || token.length < 20) {
        console.log("[Profile] No valid token, redirecting to login");
        router.replace("/");
        return;
      }
      loadUserData();
      loadPreferences();
    };
    checkAuthAndLoad();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPreferences();
    }, [])
  );

  const loadUserData = async () => {
    const userEmail = await auth.getUserEmail();
    setEmail(userEmail);
  };

  const loadPreferences = async () => {
    try {
      const prefs = await preferences.fetch();
      setUserPrefs(prefs);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  const getInitials = (email: string | null) => {
    if (!email) return "U";
    const parts = email.split("@")[0];
    return parts.length > 0 ? parts[0].toUpperCase() : "U";
  };

  const onLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("[SignOut] Starting logout process...");
              await auth.clear();
              console.log("[SignOut] Auth data cleared");
              await new Promise(resolve => setTimeout(resolve, 300));
              const token = await auth.getToken();
              if (token) {
                console.warn("[SignOut] Token still exists after clear, forcing clear again");
                await AsyncStorage.multiRemove(["auth_token", "user_email"]);
                await new Promise(resolve => setTimeout(resolve, 200));
              }
              console.log("[SignOut] Navigating to login screen (/)...");
              router.replace("/");
              setTimeout(() => {
                router.replace("/");
              }, 100);
            } catch (error) {
              console.error("[SignOut] Error during sign out:", error);
              router.replace("/");
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    const email = "mocksupport@foodlogapp.com";
    const subject = "App Support Request";
    const body = "Hello,\n\nI need help with:\n\n";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert("Error", "Unable to open email client. Please contact us at mocksupport@foodlogapp.com");
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section with Gradient */}
        <LinearGradient
          colors={[Theme.colors.primary.gradient[0], Theme.colors.primary.gradient[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerSection}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[Theme.colors.background.primary, Theme.colors.background.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{getInitials(email)}</Text>
              </LinearGradient>
              <View style={styles.avatarBadge}>
                <FontAwesome name="check" size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.userName}>{email?.split("@")[0] || "User"}</Text>
          </View>
        </LinearGradient>

        {/* Account Information Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <Card style={styles.card} padding="none" variant="elevated">
            <View style={styles.cardRow}>
              <View style={[styles.cardIconContainer, { backgroundColor: `${Theme.colors.primary.main}15` }]}>
                <FontAwesome name="envelope" size={18} color={Theme.colors.primary.main} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Email Address</Text>
                <Text style={styles.cardValue} numberOfLines={1}>{email ?? "Not available"}</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Theme.colors.text.tertiary} />
            </View>
          </Card>
        </View>

        {/* Allergies & Dietary Preferences Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health & Preferences</Text>
          <Card style={styles.card} padding="none" variant="elevated">
            <TouchableOpacity 
              style={styles.cardRow} 
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/AllergiesPreferences")}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: `${Theme.colors.accent.orange}20` }]}>
                <FontAwesome name="exclamation-triangle" size={18} color={Theme.colors.accent.orange} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Allergies & Intolerances</Text>
                <Text style={styles.cardSubtext}>
                  {userPrefs.allergies?.length > 0 
                    ? `${userPrefs.allergies.length} ${userPrefs.allergies.length === 1 ? 'allergy' : 'allergies'} set`
                    : "Not set"}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Theme.colors.text.tertiary} />
            </TouchableOpacity>
            
            <View style={styles.cardDivider} />
            
            <TouchableOpacity 
              style={styles.cardRow} 
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/AllergiesPreferences")}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: `${Theme.colors.primary.main}15` }]}>
                <FontAwesome name="leaf" size={18} color={Theme.colors.primary.main} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Dietary Preferences</Text>
                <Text style={styles.cardSubtext}>
                  {userPrefs.dietaryPreferences?.length > 0 
                    ? `${userPrefs.dietaryPreferences.length} ${userPrefs.dietaryPreferences.length === 1 ? 'preference' : 'preferences'} set`
                    : "Not set"}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Theme.colors.text.tertiary} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Security & Sync Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Sync</Text>
          <Card style={styles.card} padding="none" variant="elevated">
            <TouchableOpacity style={styles.cardRow} activeOpacity={0.7}>
              <View style={[styles.cardIconContainer, { backgroundColor: `${Theme.colors.primary.main}15` }]}>
                <FontAwesome name="lock" size={18} color={Theme.colors.primary.main} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Account Security</Text>
                <Text style={styles.cardSubtext}>Password protected</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Theme.colors.text.tertiary} />
            </TouchableOpacity>
            
            <View style={styles.cardDivider} />
            
            <View style={styles.cardRow}>
              <View style={[styles.cardIconContainer, { backgroundColor: `${Theme.colors.accent.orange}20` }]}>
                <FontAwesome name="cloud" size={18} color={Theme.colors.accent.orange} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Cloud Sync</Text>
                <Text style={styles.cardSubtext}>Active across all devices</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Synced</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Info Banner */}
        <Card style={styles.infoBanner} padding="lg" variant="outlined">
          <View style={styles.infoIconContainer}>
            <FontAwesome name="info-circle" size={20} color={Theme.colors.accent.orange} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your data is secure</Text>
            <Text style={styles.infoText}>
              All your information is encrypted and synced securely across all your devices.
            </Text>
          </View>
        </Card>

        {/* Sign Out Button */}
        <PrimaryButton
          title="Sign Out"
          onPress={onLogout}
          icon={<FontAwesome name="sign-out" size={18} color="#FFFFFF" />}
          style={styles.logoutButton}
          variant="solid"
        />

        {/* Contact Support Link */}
        <TouchableOpacity 
          style={styles.supportLink} 
          onPress={handleContactSupport}
          activeOpacity={0.7}
        >
          <FontAwesome name="envelope" size={16} color={Theme.colors.primary.main} style={styles.supportIcon} />
          <Text style={styles.supportLinkText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Theme.spacing['3xl'],
  },
  headerSection: {
    paddingTop: Theme.spacing['5xl'],
    paddingBottom: Theme.spacing['3xl'],
    paddingHorizontal: Theme.spacing.lg,
    borderBottomLeftRadius: Theme.radius['2xl'],
    borderBottomRightRadius: Theme.radius['2xl'],
    marginBottom: Theme.spacing['2xl'],
    ...Theme.shadows.modal,
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Theme.spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Theme.colors.background.primary,
    ...Theme.shadows.button,
  },
  avatarText: {
    ...Theme.typography.title,
    fontSize: 36,
    color: Theme.colors.primary.main,
    letterSpacing: 1,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.accent.yellow,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Theme.colors.background.primary,
    ...Theme.shadows.card,
  },
  greeting: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: Theme.spacing.xs,
  },
  userName: {
    ...Theme.typography.sectionTitle,
    fontSize: 24,
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  section: {
    marginBottom: Theme.spacing['2xl'],
    paddingHorizontal: Theme.spacing.lg,
  },
  sectionTitle: {
    ...Theme.typography.sectionTitle,
    marginBottom: Theme.spacing.md,
  },
  card: {
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.lg,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    ...Theme.typography.body,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  cardValue: {
    ...Theme.typography.bodySmall,
    fontWeight: '500',
    color: Theme.colors.text.secondary,
  },
  cardSubtext: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Theme.colors.border.light,
    marginHorizontal: Theme.spacing.lg,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Theme.colors.primary.main}15`,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary.main,
  },
  statusText: {
    ...Theme.typography.captionSmall,
    fontWeight: '600',
    color: Theme.colors.primary.main,
    marginLeft: Theme.spacing.xs,
  },
  infoBanner: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing['2xl'],
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.accent.orange,
    backgroundColor: `${Theme.colors.accent.orange}10`,
    flexDirection: "row",
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Theme.colors.accent.orange}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...Theme.typography.body,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  infoText: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
  },
  logoutButton: {
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
  },
  supportLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing['2xl'],
    paddingVertical: Theme.spacing.md,
  },
  supportIcon: {
    marginRight: Theme.spacing.sm,
  },
  supportLinkText: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
    color: Theme.colors.primary.main,
  },
});
