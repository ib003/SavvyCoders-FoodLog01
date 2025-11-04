import { auth } from "@/app/lib/auth";
import { UserPreferences, preferences } from "@/app/lib/preferences";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({ allergies: [], dietaryPreferences: [] });

  // Check authentication on mount (but allow dev mode bypass)
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const isAuth = await auth.isAuthenticated();
      // In dev mode, isAuthenticated returns true, so this won't redirect
      if (!isAuth) {
        router.replace("/");
        return;
      }
      loadUserData();
      loadPreferences();
    };
    checkAuthAndLoad();
  }, []);

  // Refresh preferences when screen comes into focus
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
            await auth.clear();
            router.replace("/");
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
        {/* Header Section with Gradient-like Background */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(email)}</Text>
              </View>
              <View style={styles.avatarBadge}>
                <FontAwesome name="check" size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.userName}>{email?.split("@")[0] || "User"}</Text>
          </View>
        </View>

        {/* Account Information Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardIconContainer}>
                <FontAwesome name="envelope" size={18} color={Colors.primary.green} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Email Address</Text>
                <Text style={[styles.cardValue, { marginTop: 2 }]} numberOfLines={1}>{email ?? "Not available"}</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.neutral.mutedGray} />
            </View>
          </View>
        </View>

        {/* Allergies & Dietary Preferences Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health & Preferences</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardRow} 
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/AllergiesPreferences")}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: `${Colors.primary.orange}15` }]}>
                <FontAwesome name="exclamation-triangle" size={18} color={Colors.primary.orange} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Allergies & Intolerances</Text>
                <Text style={[styles.cardSubtext, { marginTop: 2 }]}>
                  {userPrefs.allergies?.length > 0 
                    ? `${userPrefs.allergies.length} ${userPrefs.allergies.length === 1 ? 'allergy' : 'allergies'} set`
                    : "Not set"}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.neutral.mutedGray} />
            </TouchableOpacity>
            
            <View style={styles.cardDivider} />
            
            <TouchableOpacity 
              style={styles.cardRow} 
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/AllergiesPreferences")}
            >
              <View style={[styles.cardIconContainer, { backgroundColor: `${Colors.primary.green}15` }]}>
                <FontAwesome name="leaf" size={18} color={Colors.primary.green} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Dietary Preferences</Text>
                <Text style={[styles.cardSubtext, { marginTop: 2 }]}>
                  {userPrefs.dietaryPreferences?.length > 0 
                    ? `${userPrefs.dietaryPreferences.length} ${userPrefs.dietaryPreferences.length === 1 ? 'preference' : 'preferences'} set`
                    : "Not set"}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.neutral.mutedGray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security & Sync Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Sync</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardRow} activeOpacity={0.7}>
              <View style={[styles.cardIconContainer, { backgroundColor: `${Colors.primary.green}15` }]}>
                <FontAwesome name="lock" size={18} color={Colors.primary.green} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Account Security</Text>
                <Text style={[styles.cardSubtext, { marginTop: 2 }]}>Password protected</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.neutral.mutedGray} />
            </TouchableOpacity>
            
            <View style={styles.cardDivider} />
            
            <View style={styles.cardRow}>
              <View style={[styles.cardIconContainer, { backgroundColor: `${Colors.primary.orange}15` }]}>
                <FontAwesome name="cloud" size={18} color={Colors.primary.orange} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Cloud Sync</Text>
                <Text style={[styles.cardSubtext, { marginTop: 2 }]}>Active across all devices</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={[styles.statusText, { marginLeft: 6 }]}>Synced</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconContainer}>
            <FontAwesome name="info-circle" size={20} color={Colors.primary.orange} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your data is secure</Text>
            <Text style={[styles.infoText, { marginTop: 4 }]}>
              All your information is encrypted and synced securely across all your devices.
            </Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutButtonContent}>
            <FontAwesome name="sign-out" size={18} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </View>
        </TouchableOpacity>

        {/* Contact Support Link */}
        <TouchableOpacity 
          style={styles.supportLink} 
          onPress={handleContactSupport}
          activeOpacity={0.7}
        >
          <FontAwesome name="envelope" size={16} color={Colors.primary.green} style={{ marginRight: 8 }} />
          <Text style={styles.supportLinkText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // Header Section
  headerSection: {
    backgroundColor: Colors.primary.green,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 24,
    shadowColor: Colors.primary.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.neutral.cardSurface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.neutral.cardSurface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.primary.green,
    letterSpacing: 1,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.yellow,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.neutral.cardSurface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  // Section Styles
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  // Card Styles
  card: {
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary.green}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.neutral.mutedGray,
  },
  cardSubtext: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.neutral.mutedGray,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 16,
  },
  // Status Badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.primary.green}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.green,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary.green,
  },
  // Info Banner
  infoBanner: {
    flexDirection: "row",
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.orange,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary.orange}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.neutral.mutedGray,
    lineHeight: 18,
  },
  // Logout Button
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: Colors.primary.orange,
    shadowColor: Colors.primary.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  logoutButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 10,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  //contact support
  supportLink: { flexDirection: "row", alignItems: "center",justifyContent: "center", marginHorizontal: 20, marginTop: 16, marginBottom: 32, paddingVertical: 12 },
  supportLinkText: { fontSize: 14, fontWeight: "600", color: Colors.primary.green,},
});
