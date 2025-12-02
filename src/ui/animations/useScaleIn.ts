import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Scale in animation hook
 * @param duration Animation duration in ms (default: 400)
 * @param delay Delay before animation starts in ms (default: 0)
 * @returns Animated scale value
 */
export function useScaleIn(duration: number = 400, delay: number = 0) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration * 0.7,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, delay]);

  return { scale, opacity };
}

