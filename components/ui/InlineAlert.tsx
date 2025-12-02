import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/constants/Theme';
import { useSlideInY } from '@/src/ui/animations';

interface InlineAlertProps {
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  icon?: keyof typeof FontAwesome.glyphMap;
  style?: any;
}

export function InlineAlert({ 
  message, 
  type = 'error',
  icon,
  style 
}: InlineAlertProps) {
  const slideAnim = useSlideInY(20, 400, 0);

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          color: Theme.colors.semantic.success,
          bgColor: '#D1FAE5', // emerald-100
          defaultIcon: 'check-circle' as const,
        };
      case 'warning':
        return {
          color: Theme.colors.semantic.warning,
          bgColor: '#FEF3C7', // amber-100
          defaultIcon: 'exclamation-triangle' as const,
        };
      case 'info':
        return {
          color: Theme.colors.semantic.info,
          bgColor: '#DBEAFE', // blue-100
          defaultIcon: 'info-circle' as const,
        };
      default: // error
        return {
          color: Theme.colors.semantic.error,
          bgColor: '#FEE2E2', // red-100
          defaultIcon: 'exclamation-circle' as const,
        };
    }
  };

  const config = getConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bgColor },
        {
          opacity: slideAnim.opacity,
          transform: [{ translateY: slideAnim.translateY }],
        },
        style,
      ]}
    >
      <FontAwesome
        name={icon || config.defaultIcon}
        size={18}
        color={config.color}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: config.color }]}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    marginVertical: Theme.spacing.sm,
  },
  icon: {
    marginRight: Theme.spacing.sm,
  },
  text: {
    ...Theme.typography.bodySmall,
    flex: 1,
    fontWeight: '500',
  },
});
