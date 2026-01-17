import { Colors } from "@/constants/Colors";
import { COMMON_ALLERGENS, COMMON_DIETARY_PREFERENCES, preferences, UserPreferences } from "@/lib/preferences";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AllergiesPreferences() {
  const router = useRouter();
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({ allergies: [], dietaryPreferences: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const prefs = await preferences.fetch();
      setUserPrefs(prefs);
    } catch (error) {
      Alert.alert("Error", "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const toggleAllergy = (allergy: string) => {
    const current = userPrefs.allergies || [];
    const updated = current.includes(allergy)
      ? current.filter((a) => a !== allergy)
      : [...current, allergy];
    setUserPrefs({ ...userPrefs, allergies: updated });
  };

  const toggleDietaryPreference = (pref: string) => {
    const current = userPrefs.dietaryPreferences || [];
    const updated = current.includes(pref)
      ? current.filter((p) => p !== pref)
      : [...current, pref];
    setUserPrefs({ ...userPrefs, dietaryPreferences: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await preferences.save(userPrefs);
      Alert.alert("Success", "Your preferences have been saved!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.green} />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color={Colors.neutral.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Allergies & Dietary Preferences</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Allergies Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary.orange}15` }]}>
              <FontAwesome name="exclamation-triangle" size={20} color={Colors.primary.orange} />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Allergies & Intolerances</Text>
              <Text style={styles.sectionSubtitle}>Select items you're allergic or intolerant to</Text>
            </View>
          </View>

          <View style={styles.chipsContainer}>
            {COMMON_ALLERGENS.map((allergy) => {
              const isSelected = userPrefs.allergies?.includes(allergy) || false;
              return (
                <TouchableOpacity
                  key={allergy}
                  onPress={() => toggleAllergy(allergy)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.chip, isSelected && styles.chipSelected]}>
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {allergy}
                    </Text>
                    {isSelected && (
                      <FontAwesome name="check" size={12} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dietary Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary.green}15` }]}>
              <FontAwesome name="leaf" size={20} color={Colors.primary.green} />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Dietary Preferences</Text>
              <Text style={styles.sectionSubtitle}>Select your dietary tags and preferences</Text>
            </View>
          </View>

          <View style={styles.chipsContainer}>
            {COMMON_DIETARY_PREFERENCES.map((pref) => {
              const isSelected = userPrefs.dietaryPreferences?.includes(pref) || false;
              return (
                <TouchableOpacity
                  key={pref}
                  onPress={() => toggleDietaryPreference(pref)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.chip, isSelected && styles.chipSelected]}>
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {pref}
                    </Text>
                    {isSelected && (
                      <FontAwesome name="check" size={12} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <FontAwesome name="info-circle" size={18} color={Colors.primary.green} />
          <Text style={styles.infoText}>
            Your preferences will be used to personalize alerts and meal recommendations.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <FontAwesome name="check" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral.backgroundLight,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.neutral.mutedGray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.neutral.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.neutral.mutedGray,
    lineHeight: 20,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.neutral.cardSurface,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    marginBottom: 10,
    marginRight: 10,
  },
  chipSelected: {
    backgroundColor: Colors.primary.green,
    borderColor: Colors.primary.green,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutral.textDark,
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.green,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.neutral.mutedGray,
    lineHeight: 18,
    marginLeft: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.cardSurface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.green,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.primary.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

