import { useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Shake animation hook
 * @returns Object with shake function and translateX value
 */
export function useShake() {
  const translateX = useRef(new Animated.Value(0)).current;

  const shake = () => {
    translateX.setValue(0);
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: -10,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 10,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -8,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 8,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { translateX, shake };
}

