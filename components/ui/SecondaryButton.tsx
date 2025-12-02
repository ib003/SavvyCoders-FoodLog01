import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Theme } from '@/constants/Theme';
import { PressableScale } from '@/src/ui/animations';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  variant?: 'outline' | 'ghost';
}

export function SecondaryButton({
  title,
  onPress,
  disabled = false,
  icon,
  style,
  variant = 'outline',
}: SecondaryButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === 'outline' ? styles.outline : styles.ghost,
        style,
        disabled && styles.disabled,
      ]}
    >
      {icon && <>{icon}</>}
      <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>
        {title}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.radius.lg,
    gap: Theme.spacing.sm,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Theme.colors.border.medium,
    backgroundColor: Theme.colors.background.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  text: {
    ...Theme.typography.button,
    color: Theme.colors.text.primary,
  },
  outlineText: {
    color: Theme.colors.text.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
