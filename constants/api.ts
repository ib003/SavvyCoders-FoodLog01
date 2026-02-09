// constants/api.ts
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * API base URL:
 * - If EXPO_PUBLIC_API_BASE is set, use it directly.
 * - Else, build from host:
 *    - iOS device: must be your laptop LAN IP
 *    - iOS simulator: localhost works, but LAN IP also works
 *    - Android emulator: 10.0.2.2
 */
function resolveHost(): string {
  const envHost = process.env.EXPO_PUBLIC_API_HOST?.trim();
  const envBase = process.env.EXPO_PUBLIC_API_BASE?.trim();

  if (envBase && envBase.startsWith("http")) return envBase; // handled by API_BASE below
  if (envHost) return envHost;

  // Try expo hostUri (often your LAN IP)
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri ??
    "";

  const expoHost = hostUri ? hostUri.split(":")[0] : "";

  if (Platform.OS === "android") return "10.0.2.2"; // emulator mapping
  if (expoHost && expoHost !== "localhost") return expoHost;

  return "localhost";
}

export const API_BASE = (() => {
  const envBase = process.env.EXPO_PUBLIC_API_BASE?.trim();
  if (envBase && envBase.startsWith("http")) return envBase;

  const host = resolveHost();
  return `http://${host}:3000`;
})();