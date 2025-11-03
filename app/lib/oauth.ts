import { Alert } from "react-native";
import { API_BASE } from "@/app/constants/api";
import { auth } from "./auth";

/**
 * OAuth authentication helpers
 * 
 * To enable OAuth, install the following packages:
 * - expo-auth-session
 * - expo-crypto
 * 
 * Then configure OAuth providers in your backend and update these functions.
 */

export type OAuthProvider = "google" | "apple";

export interface OAuthResult {
  success: boolean;
  token?: string;
  email?: string;
  error?: string;
}

/**
 * Sign in with Google OAuth
 * 
 * TODO: Implement using expo-auth-session
 * 1. Install: npx expo install expo-auth-session expo-crypto
 * 2. Configure Google OAuth in your backend
 * 3. Set up OAuth credentials in app.json
 * 4. Implement the authentication flow
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    // Placeholder for OAuth implementation
    // This would use expo-auth-session to:
    // 1. Open OAuth provider's login page
    // 2. Handle redirect with authorization code
    // 3. Exchange code for token with backend
    // 4. Save token using auth.saveToken()

    Alert.alert(
      "OAuth Setup Required",
      "Google Sign-In requires additional setup:\n\n" +
      "1. Install: npx expo install expo-auth-session expo-crypto\n" +
      "2. Configure OAuth in backend\n" +
      "3. Update this function with OAuth flow"
    );

    return {
      success: false,
      error: "OAuth not yet configured",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Google sign-in failed",
    };
  }
}

/**
 * Sign in with Apple OAuth
 * 
 * TODO: Implement using expo-auth-session
 * Note: Apple Sign-In is only available on iOS devices
 * 1. Install: npx expo install expo-auth-session expo-crypto
 * 2. Configure Apple OAuth in your backend
 * 3. Set up Apple Sign-In in Apple Developer Console
 * 4. Implement the authentication flow
 */
export async function signInWithApple(): Promise<OAuthResult> {
  try {
    // Placeholder for OAuth implementation
    // This would use expo-auth-session to:
    // 1. Open Apple Sign-In modal
    // 2. Handle authorization response
    // 3. Exchange credentials for token with backend
    // 4. Save token using auth.saveToken()

    Alert.alert(
      "OAuth Setup Required",
      "Apple Sign-In requires additional setup:\n\n" +
      "1. Install: npx expo install expo-auth-session expo-crypto\n" +
      "2. Configure Apple OAuth in backend\n" +
      "3. Set up Apple Sign-In in Apple Developer Console\n" +
      "4. Update this function with OAuth flow"
    );

    return {
      success: false,
      error: "OAuth not yet configured",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Apple sign-in failed",
    };
  }
}

/**
 * Handle OAuth callback from backend
 * This would be called after successful OAuth authentication
 */
export async function handleOAuthCallback(
  provider: OAuthProvider,
  token: string,
  email?: string
): Promise<void> {
  try {
    await auth.saveToken(token);
    if (email) {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem("user_email", email);
    }
  } catch (error) {
    console.error("Failed to save OAuth token:", error);
    throw error;
  }
}

/**
 * Example implementation structure for Google OAuth:
 * 
 * import * as AuthSession from 'expo-auth-session';
 * import * as WebBrowser from 'expo-web-browser';
 * 
 * WebBrowser.maybeCompleteAuthSession();
 * 
 * const discovery = {
 *   authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
 *   tokenEndpoint: 'https://oauth2.googleapis.com/token',
 * };
 * 
 * const [request, response, promptAsync] = AuthSession.useAuthRequest(
 *   {
 *     clientId: 'YOUR_GOOGLE_CLIENT_ID',
 *     scopes: ['openid', 'profile', 'email'],
 *     redirectUri: AuthSession.makeRedirectUri(),
 *   },
 *   discovery
 * );
 * 
 * // Then in your component:
 * const result = await promptAsync();
 * if (result.type === 'success') {
 *   // Exchange code for token with your backend
 *   const backendResponse = await fetch(`${API_BASE}/auth/oauth/google`, {
 *     method: 'POST',
 *     body: JSON.stringify({ code: result.params.code }),
 *   });
 *   const { token, email } = await backendResponse.json();
 *   await handleOAuthCallback('google', token, email);
 * }
 */

