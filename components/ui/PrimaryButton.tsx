import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme } from '@/constants/Theme';
import { PressableScale } from '@/src/ui/animations';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  variant?: 'gradient' | 'solid';
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
  variant = 'gradient',
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </>
  );

  const button = variant === 'gradient' ? (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.button, style, isDisabled && styles.disabled]}
    >
      <LinearGradient
        colors={[Theme.colors.primary.gradient[0], Theme.colors.primary.gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {buttonContent}
        </View>
      </LinearGradient>
    </PressableScale>
  ) : (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        styles.solidButton,
        { backgroundColor: Theme.colors.primary.main },
        style,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {buttonContent}
      </View>
    </PressableScale>
  );

  return button;
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Theme.radius.lg,
    overflow: 'hidden',
    ...Theme.shadows.button,
  },
  gradient: {
    borderRadius: Theme.radius.lg,
  },
  solidButton: {
    backgroundColor: Theme.colors.primary.main,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
    gap: Theme.spacing.sm,
  },
  text: {
    ...Theme.typography.button,
    color: Theme.colors.text.inverse,
  },
  disabled: {
    opacity: 0.6,
  },
});
