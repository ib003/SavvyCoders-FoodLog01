 import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { auth } from '@/src/lib/auth';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Change this to 'index' to show login first
  initialRouteName: 'index',  // Changed from '(tabs)'
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  // Root-level auth guard - single source of truth
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    (async () => {
      try {
        // Wait a bit to ensure AsyncStorage operations complete
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!mounted) return;

        const token = await auth.getToken();
        const inAuthGroup = segments[0] === '(tabs)';
        const hasValidToken = token && typeof token === 'string' && token.length >= 20;

        console.log('[RootLayout] Auth check:', {
          hasToken: !!token,
          tokenLength: token?.length || 0,
          inAuthGroup,
          hasValidToken,
          segments: segments.join('/'),
        });

        // Only redirect if we're actually navigating (not on initial load)
        const isInitialLoad = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');
        
        if (!hasValidToken && inAuthGroup) {
          // User is in protected area but has no token - redirect to login
          console.log('[RootLayout] No valid token in protected area, redirecting to login');
          router.replace('/');
        } else if (hasValidToken && !inAuthGroup && segments[0] !== 'register' && !isInitialLoad) {
          // User has token but is on login screen - redirect to tabs
          // But only if not on initial load (to prevent redirect loops)
          console.log('[RootLayout] Valid token found, redirecting to tabs');
          timeoutId = setTimeout(() => {
            if (mounted) {
              router.replace('/(tabs)/Dashboard');
            }
          }, 100);
        }
      } catch (error) {
        console.error('[RootLayout] Auth guard error:', error);
        // On error, redirect to login for safety
        if (mounted && segments[0] === '(tabs)') {
          router.replace('/');
        }
      }
    })();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen 
          name="chat" 
          options={{ 
            presentation: 'modal',
            gestureEnabled: false,
            headerShown: false,
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
