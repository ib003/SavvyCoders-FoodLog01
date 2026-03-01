import { API_BASE } from "@/src/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { auth } from "./auth";

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = "google" | "apple";

export interface OAuthResult {
  success: boolean;
  token?: string;
  email?: string;
  error?: string;
}

/**
 * Sign in with Google OAuth using Expo Proxy
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    console.log("[Google OAuth] Starting Google sign-in...");
    
    const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!GOOGLE_CLIENT_ID) {
      const error = "Google Client ID not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env file.";
      console.error("[Google OAuth] Error:", error);
      return {
        success: false,
        error,
      };
    }

    console.log("[Google OAuth] Client ID configured, creating auth request...");

// Use Expo AuthSession proxy redirect (HTTPS) — required for Google in Expo Go
const redirectUri = AuthSession.makeRedirectUri({
  scheme: "savvytrackertabs",
  path: "redirect",
});
console.log("[Google OAuth] Using redirect URI:", redirectUri);

    // Configure Google OAuth discovery
    const discovery = {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    };

    // Create auth request with proper configuration
    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
    });

    console.log("[Google OAuth] Prompting user for authentication...");
    console.log("[Google OAuth] Make sure you:");
    console.log("[Google OAuth] 1. Complete the sign-in in the browser (don't close it)");
    console.log("[Google OAuth] 2. Are signed in with a test user email");
    console.log("[Google OAuth] 3. Have added the redirect URI to Google Cloud Console");
    
const result = await request.promptAsync(discovery);
console.log("[Google OAuth] Auth result type:", result.type);
console.log("[Google OAuth] Full result:", JSON.stringify(result, null, 2));

if (result.type !== "success") {
  const error =
    result.type === "cancel" ? "Sign in cancelled" : `Google sign-in failed: ${result.type}`;
  console.error("[Google OAuth] Error:", error);
  return { success: false, error };
}

const id_token = (result.params as any)?.id_token;
if (!id_token) {
  return { success: false, error: "No ID token received from Google" };
}

    console.log("[Google OAuth] ID token received, sending to backend...");

    // Send idToken to backend
    const response = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: id_token }),
    });

    console.log("[Google OAuth] Backend response status:", response.status);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        const text = await response.text();
        errorData = { error: text || `Server error (${response.status})` };
      }
      const error = errorData.error || "Failed to authenticate with backend";
      console.error("[Google OAuth] Backend error:", error);
      console.error("[Google OAuth] Full error response:", JSON.stringify(errorData, null, 2));
      return {
        success: false,
        error,
      };
    }

    const data = await response.json();
    console.log("[Google OAuth] Backend response received");
    
    if (!data.token) {
      const error = "No token received from server";
      console.error("[Google OAuth] Error:", error);
      console.error("[Google OAuth] Response data:", JSON.stringify(data, null, 2));
      return {
        success: false,
        error,
      };
    }

    console.log("[Google OAuth] Saving token and user info...");
    // Save token and user info
    await auth.saveToken(data.token);
    if (data.user?.email) {
      await AsyncStorage.setItem("user_email", data.user.email);
    }

    console.log("[Google OAuth] Sign-in successful!");
    return {
      success: true,
      token: data.token,
      email: data.user?.email,
    };
  } catch (error: any) {
    console.error("[Google OAuth] Unexpected error:", error);
    console.error("[Google OAuth] Error stack:", error.stack);
    console.error("[Google OAuth] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return {
      success: false,
      error: error.message || "Google sign-in failed",
    };
  }
}

/**
 * Sign in with Apple OAuth
 * Note: Only available on iOS devices
 */
export async function signInWithApple(): Promise<OAuthResult> {
  try {
    console.log("[Apple OAuth] Starting Apple sign-in...");
    
    if (Platform.OS !== "ios") {
      const error = "Apple Sign-In is only available on iOS devices";
      console.error("[Apple OAuth] Error:", error);
      return {
        success: false,
        error,
      };
    }

    console.log("[Apple OAuth] Checking if Apple Authentication is available...");
    // Check if Apple Authentication is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      const error = "Apple Sign-In is not available on this device";
      console.error("[Apple OAuth] Error:", error);
      return {
        success: false,
        error,
      };
    }

    console.log("[Apple OAuth] Prompting user for authentication...");
    // Request Apple authentication
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log("[Apple OAuth] Credential received");

    if (!credential.identityToken) {
      const error = "No identity token received from Apple";
      console.error("[Apple OAuth] Error:", error);
      return {
        success: false,
        error,
      };
    }

    console.log("[Apple OAuth] Identity token received, sending to backend...");

    // Send identityToken to backend
    const response = await fetch(`${API_BASE}/auth/apple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode || null,
        user: {
          email: credential.email || null,
          fullName: credential.fullName
            ? {
                givenName: credential.fullName.givenName || null,
                familyName: credential.fullName.familyName || null,
              }
            : null,
        },
      }),
    });

    console.log("[Apple OAuth] Backend response status:", response.status);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        const text = await response.text();
        errorData = { error: text || `Server error (${response.status})` };
      }
      const error = errorData.error || "Failed to authenticate with backend";
      console.error("[Apple OAuth] Backend error:", error);
      console.error("[Apple OAuth] Full error response:", JSON.stringify(errorData, null, 2));
      return {
        success: false,
        error,
      };
    }

    const data = await response.json();
    console.log("[Apple OAuth] Backend response received");
    
    if (!data.token) {
      const error = "No token received from server";
      console.error("[Apple OAuth] Error:", error);
      console.error("[Apple OAuth] Response data:", JSON.stringify(data, null, 2));
      return {
        success: false,
        error,
      };
    }

    console.log("[Apple OAuth] Saving token and user info...");
    // Save token and user info
    await auth.saveToken(data.token);
    if (data.user?.email) {
      await AsyncStorage.setItem("user_email", data.user.email);
    }

    console.log("[Apple OAuth] Sign-in successful!");
    return {
      success: true,
      token: data.token,
      email: data.user?.email,
    };
  } catch (error: any) {
    console.error("[Apple OAuth] Unexpected error:", error);
    console.error("[Apple OAuth] Error stack:", error.stack);
    console.error("[Apple OAuth] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    if (error.code === "ERR_REQUEST_CANCELED") {
      return {
        success: false,
        error: "Sign in cancelled",
      };
    }

    return {
      success: false,
      error: error.message || "Apple sign-in failed",
    };
  }
}
