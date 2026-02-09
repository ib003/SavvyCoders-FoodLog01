import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';

interface GradientScreenProps {
  children: ReactNode;
  gradient?: string[];
  showGradient?: boolean;
  style?: any;
}

export function GradientScreen({ 
  children, 
  gradient = Theme.colors.background.gradient,
  showGradient = true,
  style 
}: GradientScreenProps) {
  const content = (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );

  if (showGradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {content}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={[styles.container, styles.safeArea, { backgroundColor: Theme.colors.background.secondary }, style]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
});

