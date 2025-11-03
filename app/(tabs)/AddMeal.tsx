import { auth } from "@/app/lib/auth";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AddMealTab() {
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await auth.isAuthenticated();
      if (!isAuth) {
        router.replace("/");
      }
    };
    checkAuth();
  }, []);

  const OptionCard = ({ 
    icon, 
    iconColor, 
    iconBg, 
    title, 
    description, 
    to 
  }: { 
    icon: string; 
    iconColor: string; 
    iconBg: string;
    title: string; 
    description: string; 
    to: Href 
  }) => (
    <Pressable 
      style={styles.optionCard}
      onPress={() => router.push(to)}
      android_ripple={{ color: Colors.neutral.mutedGray }}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <FontAwesome name={icon as any} size={28} color={iconColor} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <FontAwesome name="chevron-right" size={20} color={Colors.neutral.mutedGray} />
    </Pressable>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Add Meal</Text>
        <Text style={styles.subtitle}>Choose how you want to log your meal</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        <OptionCard
          icon="search"
          iconColor={Colors.primary.green}
          iconBg={`${Colors.primary.green}15`}
          title="Search Database"
          description="Search from thousands of foods in our database"
          to="/add/search"
        />
        
        <OptionCard
          icon="bookmark"
          iconColor={Colors.primary.orange}
          iconBg={`${Colors.primary.orange}15`}
          title="Saved Foods"
          description="Quickly add from your frequently used items"
          to="/add/saved"
        />
        
        <OptionCard
          icon="barcode"
          iconColor={Colors.primary.yellow}
          iconBg={`${Colors.primary.yellow}15`}
          title="Barcode Scan"
          description="Scan barcodes to check product safety instantly"
          to="/add/barcode"
        />
        
        <OptionCard
          icon="edit"
          iconColor={Colors.neutral.mutedGray}
          iconBg={`${Colors.neutral.mutedGray}15`}
          title="Manual Entry"
          description="Create a custom meal entry manually"
          to="/add/search"
        />
      </View>

      {/* Quick Tips */}
      <View style={styles.tipsContainer}>
        <View style={styles.tipHeader}>
          <FontAwesome name="lightbulb-o" size={18} color={Colors.primary.yellow} />
          <Text style={styles.tipTitle}>Quick Tip</Text>
        </View>
        <Text style={styles.tipText}>
          Use the search to find foods quickly, or save your favorites for faster logging!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.backgroundLight,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.neutral.mutedGray,
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.cardSurface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.neutral.mutedGray,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: `${Colors.primary.yellow}10`,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.yellow,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginLeft: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.neutral.mutedGray,
    lineHeight: 20,
  },
});
