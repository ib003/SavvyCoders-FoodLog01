import { Card } from "@/components/ui/Card";
import { Theme } from "@/constants/Theme";
import { auth } from "@/src/lib/auth";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Href, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AddMealTab() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await auth.getToken();
      if (!token || typeof token !== 'string' || token.length < 20) {
        console.log("[AddMeal] No valid token, redirecting to login");
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
    to,
    gradient
  }: { 
    icon: string; 
    iconColor: string; 
    iconBg: string;
    title: string; 
    description: string; 
    to: Href;
    gradient?: boolean;
  }) => (
    <Pressable 
      onPress={() => router.push(to)}
      style={styles.optionCardPressable}
    >
      <Card style={styles.optionCard} padding="lg" variant="elevated">
        {gradient ? (
          <LinearGradient
            colors={[iconBg, iconBg + '80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <FontAwesome name={icon as any} size={28} color={iconColor} />
          </LinearGradient>
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <FontAwesome name={icon as any} size={28} color={iconColor} />
          </View>
        )}
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionDescription}>{description}</Text>
        </View>
        <FontAwesome name="chevron-right" size={18} color={Theme.colors.text.tertiary} />
      </Card>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.background.gradient[0], Theme.colors.background.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Meal</Text>
          <Text style={styles.subtitle}>Choose how you want to log your meal</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.optionsContainer}>
          <OptionCard
            icon="search"
            iconColor="#FFFFFF"
            iconBg={Theme.colors.primary.main}
            title="Search Database"
            description="Search from thousands of foods in our database"
            to="/search"
            gradient
          />
          
          <OptionCard
            icon="bookmark"
            iconColor={Theme.colors.accent.orange}
            iconBg={`${Theme.colors.accent.orange}20`}
            title="Saved Foods"
            description="Quickly add from your frequently used items"
            to="/saved"
          />
          
          <OptionCard
            icon="barcode"
            iconColor={Theme.colors.accent.yellow}
            iconBg={`${Theme.colors.accent.yellow}20`}
            title="Barcode Scan"
            description="Scan barcodes to check product safety instantly"
            to="/barcode"
          />
          
          <OptionCard
            icon="camera"
            iconColor={Theme.colors.accent.orange}
            iconBg={`${Theme.colors.accent.orange}20`}
            title="Add Photo"
            description="Take a photo of your meal to log it"
            to="/photo"
          />
          
          <OptionCard
            icon="edit"
            iconColor={Theme.colors.text.secondary}
            iconBg={`${Theme.colors.text.secondary}15`}
            title="Manual Entry"
            description="Create a custom meal entry manually"
            to="/search"
          />
        </View>

        <Card style={styles.tipsContainer} padding="lg" variant="outlined">
          <View style={styles.tipHeader}>
            <FontAwesome name="lightbulb-o" size={18} color={Theme.colors.accent.yellow} />
            <Text style={styles.tipTitle}>Quick Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Use the search to find foods quickly, or save your favorites for faster logging!
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.secondary,
  },
  headerGradient: {
    paddingTop: Theme.spacing['5xl'],
    paddingBottom: Theme.spacing['2xl'],
    paddingHorizontal: Theme.spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
  },
  title: {
    ...Theme.typography.title,
    fontSize: 32,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing['3xl'],
  },
  optionsContainer: {
    marginBottom: Theme.spacing['2xl'],
    gap: Theme.spacing.md,
  },
  optionCardPressable: {
    marginBottom: Theme.spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...Theme.typography.sectionTitle,
    fontSize: 18,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  optionDescription: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.text.secondary,
    lineHeight: 20,
  },
  tipsContainer: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.accent.yellow,
    backgroundColor: `${Theme.colors.accent.yellow}10`,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  tipTitle: {
    ...Theme.typography.body,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  tipText: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
    lineHeight: 20,
  },
});
