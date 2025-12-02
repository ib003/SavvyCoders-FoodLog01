import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Stagger animation hook for multiple items
 * @param count Number of items to animate
 * @param duration Animation duration per item (default: 300)
 * @param staggerDelay Delay between each item in ms (default: 100)
 * @returns Array of animated opacity values
 */
export function useStagger(count: number, duration: number = 300, staggerDelay: number = 100) {
  const opacities = useRef(
    Array.from({ length: count }, () => new Animated.Value(0))
  ).current;
  const translateYs = useRef(
    Array.from({ length: count }, () => new Animated.Value(20))
  ).current;

  useEffect(() => {
    const animations = opacities.map((opacity, index) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          delay: index * staggerDelay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateYs[index], {
          toValue: 0,
          duration,
          delay: index * staggerDelay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(staggerDelay, animations).start();
  }, [count, duration, staggerDelay]);

  return opacities.map((opacity, index) => ({
    opacity,
    translateY: translateYs[index],
  }));
}

