import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  scale?: number;
  style?: ViewStyle;
}

/**
 * Pressable component with scale animation on press
 * @param scale Scale value when pressed (default: 0.98)
 * @param children Child components
 * @param style Additional styles
 */
export function PressableScale({ 
  children, 
  scale = 0.98, 
  style,
  ...props 
}: PressableScaleProps) {
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: scale,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: animatedScale }],
          opacity: animatedOpacity,
        },
        style,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

