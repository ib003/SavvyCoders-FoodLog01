import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Slide in from Y position animation hook
 * @param distance Distance to slide from (default: 20)
 * @param duration Animation duration in ms (default: 400)
 * @param delay Delay before animation starts in ms (default: 0)
 * @returns Animated translateY value
 */
export function useSlideInY(distance: number = 20, duration: number = 400, delay: number = 0) {
  const translateY = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [distance, duration, delay]);

  return { translateY, opacity };
}

