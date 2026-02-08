import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Theme } from '@/constants/Theme';
import { useShake } from '@/src/ui/animations';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof FontAwesome.glyphMap;
  rightIcon?: React.ReactNode;
  containerStyle?: any;
}

export function TextField({
  label,
  error,
  icon,
  rightIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { translateX, shake } = useShake();
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0)).current;

  // Animate border color on focus
  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.timing(borderColorAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false, // borderColor doesn't support native driver
        }),
        Animated.timing(glowOpacityAnim, {
          toValue: 0.3,
          duration: 200,
          // shadowOpacity is not supported by native driver
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(borderColorAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(glowOpacityAnim, {
          toValue: 0,
          duration: 200,
          // shadowOpacity is not supported by native driver
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isFocused]);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      shake();
    }
  }, [error, shake]);

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Theme.colors.border.light, Theme.colors.primary.main],
  });

  const errorBorderColor = error ? Theme.colors.semantic.error : borderColor;

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        {
          transform: [{ translateX }],
        },
      ]}
    >
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor: error ? Theme.colors.semantic.error : borderColor,
            shadowOpacity: glowOpacityAnim,
          },
          isFocused && !error && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
        ]}
      >
        {icon && (
          <FontAwesome
            name={icon}
            size={18}
            color={isFocused ? Theme.colors.primary.main : Theme.colors.text.tertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Theme.colors.text.tertiary}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>
      {error && (
        <Animated.View style={{ opacity: error ? 1 : 0 }}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background.primary,
    borderWidth: 1.5,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.lg,
    minHeight: 56,
    shadowColor: Theme.colors.primary.main,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrapperFocused: {
    // Styles applied via animated values
  },
  inputWrapperError: {
    borderColor: Theme.colors.semantic.error,
    shadowColor: Theme.colors.semantic.error,
  },
  leftIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...Theme.typography.body,
    color: Theme.colors.text.primary,
    paddingVertical: 0,
  },
  rightIcon: {
    marginLeft: Theme.spacing.sm,
  },
  errorText: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.semantic.error,
    marginTop: Theme.spacing.xs,
  },
});
