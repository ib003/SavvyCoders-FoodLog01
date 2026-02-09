import { Alert } from "react-native";
import { auth } from "./auth";

export type OAuthProvider = "google" | "apple";

export interface OAuthResult {
  success: boolean;
  token?: string;
  email?: string;
  error?: string;
}

/**
 * Sign in with Google OAuth
 * (Placeholder — your actual Google login is in your Login/Register screens already)
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    Alert.alert(
      "OAuth Setup Required",
      "Google Sign-In requires additional setup:\n\n" +
        "1. Install: npx expo install expo-auth-session expo-crypto\n" +
        "2. Configure OAuth in backend\n" +
        "3. Update this function with OAuth flow"
    );

    return { success: false, error: "OAuth not yet configured" };
  } catch (error: any) {
    return { success: false, error: error?.message || "Google sign-in failed" };
  }
}

/**
 * Sign in with Apple OAuth
 * (Placeholder)
 */
export async function signInWithApple(): Promise<OAuthResult> {
  try {
    Alert.alert(
      "OAuth Setup Required",
      "Apple Sign-In requires additional setup:\n\n" +
        "1. Install: npx expo install expo-auth-session expo-crypto\n" +
        "2. Configure Apple OAuth in backend\n" +
        "3. Update this function with OAuth flow"
    );

    return { success: false, error: "OAuth not yet configured" };
  } catch (error: any) {
    return { success: false, error: error?.message || "Apple sign-in failed" };
  }
}

/**
 * Save OAuth session (token + optional email)
 * ✅ Uses your auth helpers (no require hacks, no hard-coded keys)
 */
export async function handleOAuthCallback(
  _provider: OAuthProvider,
  token: string,
  email?: string
): Promise<void> {
  if (!token || typeof token !== "string") {
    throw new Error("Missing token in OAuth callback");
  }

  try {
    await auth.saveToken(token);

    if (email && typeof email === "string") {
      // only if you added saveUserEmail in auth.ts (recommended)
      if (typeof (auth as any).saveUserEmail === "function") {
        await (auth as any).saveUserEmail(email.trim());
      }
    }
  } catch (error) {
    console.error("Failed to save OAuth token:", error);
    throw error;
  }
}