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

interface AllergenWarningProps {
  analysis: {
    hasAllergenWarning: boolean;
    allergenMatches: string[];
    hasDietaryConflict: boolean;
    dietaryMatches: string[];
    dietaryConflicts: string[];
    warnings: string[];
  };
  onDismiss?: () => void;
  variant?: "full" | "compact" | "banner" | "inline";
  showAnimation?: boolean;
}

export default function AllergenWarning({
  analysis,
  onDismiss,
  variant = "full",
  showAnimation = true,
}: AllergenWarningProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const isCritical = analysis.hasAllergenWarning;
  const isWarning = analysis.hasDietaryConflict && !analysis.hasAllergenWarning;

  useEffect(() => {
    if (showAnimation) {
      // Slide in and fade in
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

      // Pulse for critical alerts
      if (isCritical) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.02,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Shake animation for critical
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: -5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -3,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      // No animation
      slideAnim.setValue(0);
      opacityAnim.setValue(1);
    }
  }, [analysis, showAnimation, isCritical]);

  if (variant === "banner") {
    return (
      <Animated.View
        style={[
          styles.bannerContainer,
          isCritical && styles.criticalBanner,
          isWarning && styles.warningBanner,
          {
            opacity: opacityAnim,
            transform: [
              { translateY: slideAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        <View style={styles.bannerContent}>
          <FontAwesome
            name={isCritical ? "exclamation-triangle" : "info-circle"}
            size={18}
            color="#FFFFFF"
            style={styles.bannerIcon}
          />
          <Text style={styles.bannerText} numberOfLines={1}>
            {isCritical 
              ? `⚠️ Contains allergens: ${analysis.allergenMatches.join(", ")}`
              : `⚠️ Dietary conflict: ${analysis.dietaryConflicts.join(", ")}`}
          </Text>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.bannerDismiss}>
              <FontAwesome name="times" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  }

  if (variant === "inline") {
    return (
      <Animated.View
        style={[
          styles.inlineContainer,
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
        <Text style={styles.inlineText}>
          {isCritical 
            ? ` ${analysis.allergenMatches.join(", ")}`
            : ` ${analysis.dietaryConflicts.join(", ")}`}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        variant === "compact" && styles.compact,
        isCritical && styles.criticalContainer,
        isWarning && styles.warningContainer,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: slideAnim },
            { translateX: shakeAnim },
            { scale: isCritical && showAnimation ? pulseAnim : 1 },
          ],
        },
      ]}
    >
      {/* Gradient Background */}
      <View 
        style={[
          styles.gradientBackground,
          isCritical && styles.criticalGradient,
          isWarning && styles.warningGradient,
        ]} 
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <Animated.View 
          style={[
            styles.iconContainer,
            isCritical && styles.criticalIconContainer,
            isWarning && styles.warningIconContainer,
          ]}
        >
          <FontAwesome
            name={isCritical ? "exclamation-triangle" : "info-circle"}
            size={26}
            color="#FFFFFF"
          />
        </Animated.View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.alertTitle}>
              {isCritical ? "🚨 ALLERGEN ALERT" : "⚠️ DIETARY WARNING"}
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
                    <FontAwesome name="times-circle" size={11} color="#FFFFFF" />
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
                    <FontAwesome name="info-circle" size={11} color={Colors.neutral.textDark} />
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
                ? "⚠️ This product contains ingredients you're allergic to. Please proceed with extreme caution!"
                : "This product may not align with your dietary preferences."}
            </Text>
          </View>
        </View>
      </View>

      {/* Top Border Accent */}
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
    marginVertical: 12,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  compact: {
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
    opacity: 0.12,
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
    padding: 18,
    backgroundColor: "rgba(255, 159, 69, 0.08)",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
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
    fontSize: 15,
    fontWeight: "800",
    color: Colors.neutral.textDark,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dismissButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
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
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginBottom: 10,
    opacity: 0.95,
  },
  allergenBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },
  allergenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.orange,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: Colors.primary.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  allergenBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 6,
    textTransform: "capitalize",
  },
  dietaryBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },
  dietaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.yellow,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  dietaryBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.neutral.textDark,
    marginLeft: 6,
    textTransform: "capitalize",
  },
  messageContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.orange,
  },
  messageText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    lineHeight: 19,
  },
  borderAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  criticalBorder: {
    backgroundColor: Colors.primary.orange,
  },
  warningBorder: {
    backgroundColor: Colors.primary.yellow,
  },
  // Banner variant
  bannerContainer: {
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  criticalBanner: {
    backgroundColor: Colors.primary.orange,
  },
  warningBanner: {
    backgroundColor: Colors.primary.yellow,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  bannerIcon: {
    marginRight: 10,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bannerDismiss: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  // Inline variant
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.primary.orange}15`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.orange,
  },
  inlineText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.neutral.textDark,
    marginLeft: 6,
  },
});
