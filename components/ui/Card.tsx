import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Theme } from '@/constants/Theme';

type SpacingKey = keyof typeof Theme.spacing;
type PaddingValue = SpacingKey | 'none';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: PaddingValue;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ 
  children, 
  style, 
  padding = 'lg',
  variant = 'default' 
}: CardProps) {
  const paddingValue = padding === 'none' ? 0 : Theme.spacing[padding as keyof typeof Theme.spacing];
  
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        { padding: paddingValue },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.background.primary,
    borderRadius: Theme.radius.lg,
  },
  elevated: {
    ...Theme.shadows.card,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
});

