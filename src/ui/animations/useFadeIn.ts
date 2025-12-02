import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Fade in animation hook
 * @param duration Animation duration in ms (default: 300)
 * @param delay Delay before animation starts in ms (default: 0)
 * @returns Animated opacity value
 */
export function useFadeIn(duration: number = 300, delay: number = 0) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [duration, delay]);

  return opacity;
}

