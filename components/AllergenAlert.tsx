import { analyzeFood } from "@/src/lib/allergenChecker";
import { Colors } from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AllergenAlertProps {
  foodTags: string[];
  onDismiss?: () => void;
  showIcon?: boolean;
  compact?: boolean;
  variant?: "full" | "compact" | "minimal";
}

export default function AllergenAlert({
  foodTags,
  onDismiss,
  showIcon = true,
  compact = false,
  variant = "full",
}: AllergenAlertProps) {
  const [analysis, setAnalysis] = React.useState<{
    hasAllergenWarning: boolean;
    allergenMatches: string[];
    hasDietaryConflict: boolean;
    dietaryMatches: string[];
    dietaryConflicts: string[];
    warnings: string[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    loadAnalysis();
  }, [foodTags]);

  useEffect(() => {
    if (analysis && (analysis.hasAllergenWarning || analysis.hasDietaryConflict)) {
      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for critical warnings
      if (analysis.hasAllergenWarning) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [analysis]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeFood(foodTags);
      setAnalysis(result);
    } catch (error) {
      console.error("Failed to analyze food:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analysis) {
    return null;
  }

  // Only show alert if there are warnings
  if (!analysis.hasAllergenWarning && !analysis.hasDietaryConflict) {
    return null;
  }

  const isCritical = analysis.hasAllergenWarning;
  const isWarning = analysis.hasDietaryConflict && !analysis.hasAllergenWarning;

  if (variant === "minimal") {
    return (
      <Animated.View
        style={[
          styles.minimalContainer,
          {
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <FontAwesome 
          name="exclamation-triangle" 
          size={16} 
          color={isCritical ? Colors.primary.orange : Colors.primary.yellow} 
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.compact,
        isCritical && styles.criticalContainer,
        isWarning && styles.warningContainer,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: slideAnim },
            { scale: isCritical ? pulseAnim : 1 },
          ],
        },
      ]}
    >
      {/* Background gradient effect */}
      <View 
        style={[
          styles.gradientBackground,
          isCritical && styles.criticalGradient,
          isWarning && styles.warningGradient,
        ]} 
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon Section */}
        {showIcon && (
          <Animated.View 
            style={[
              styles.iconContainer,
              isCritical && styles.criticalIconContainer,
              isWarning && styles.warningIconContainer,
            ]}
          >
            <FontAwesome
              name={isCritical ? "exclamation-triangle" : "info-circle"}
              size={24}
              color="#FFFFFF"
            />
          </Animated.View>
        )}

        {/* Text Content */}
        <View style={styles.textContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.alertTitle}>
              {isCritical ? "⚠️ ALLERGEN ALERT" : "⚠️ DIETARY WARNING"}
            </Text>
            {onDismiss && (
              <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
                <FontAwesome name="times" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Allergen Matches */}
          {analysis.hasAllergenWarning && (
            <View style={styles.allergenSection}>
              <Text style={styles.sectionLabel}>Contains allergens:</Text>
              <View style={styles.allergenBadges}>
                {analysis.allergenMatches.map((allergen, index) => (
                  <View key={index} style={styles.allergenBadge}>
                    <FontAwesome name="times-circle" size={12} color="#FFFFFF" />
                    <Text style={styles.allergenBadgeText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Dietary Conflicts */}
          {analysis.hasDietaryConflict && (
            <View style={styles.dietarySection}>
              <Text style={styles.sectionLabel}>Dietary conflicts:</Text>
              <View style={styles.dietaryBadges}>
                {analysis.dietaryConflicts.map((conflict, index) => (
                  <View key={index} style={styles.dietaryBadge}>
                    <FontAwesome name="info-circle" size={12} color={Colors.neutral.textDark} />
                    <Text style={styles.dietaryBadgeText}>{conflict}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Safety Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              {isCritical 
                ? "⚠️ This product contains ingredients you're allergic to. Proceed with caution!"
                : "This product may not align with your dietary preferences."}
            </Text>
          </View>
        </View>
      </View>

      {/* Decorative border */}
      <View 
        style={[
          styles.borderAccent,
          isCritical && styles.criticalBorder,
          isWarning && styles.warningBorder,
        ]} 
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 0,
    marginVertical: 12,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  compact: {
    padding: 0,
    marginVertical: 8,
  },
  criticalContainer: {
    borderWidth: 2,
    borderColor: Colors.primary.orange,
  },
  warningContainer: {
    borderWidth: 2,
    borderColor: Colors.primary.yellow,
  },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  criticalGradient: {
    backgroundColor: Colors.primary.orange,
  },
  warningGradient: {
    backgroundColor: Colors.primary.yellow,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "rgba(255, 159, 69, 0.1)",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  criticalIconContainer: {
    backgroundColor: Colors.primary.orange,
  },
  warningIconContainer: {
    backgroundColor: Colors.primary.yellow,
  },
  textContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  allergenSection: {
    marginBottom: 12,
  },
  dietarySection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    marginBottom: 8,
    opacity: 0.9,
  },
  allergenBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  allergenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.orange,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
    shadowColor: Colors.primary.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  allergenBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 6,
    textTransform: "capitalize",
  },
  dietaryBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  dietaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.yellow,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  dietaryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginLeft: 6,
    textTransform: "capitalize",
  },
  messageContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  messageText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    lineHeight: 18,
  },
  borderAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  criticalBorder: {
    backgroundColor: Colors.primary.orange,
  },
  warningBorder: {
    backgroundColor: Colors.primary.yellow,
  },
  minimalContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.orange,
    alignItems: "center",
    justifyContent: "center",
  },
});

