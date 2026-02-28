import { Platform } from "react-native";

// Put your Cloudflare URL in .env as EXPO_PUBLIC_API_BASE
// Example:
// EXPO_PUBLIC_API_BASE=https://publishers-chester-pennsylvania-arctic.trycloudflare.com
const ENV_BASE =
  process.env.EXPO_PUBLIC_API_BASE ||
  process.env.EXPO_PUBLIC_API_URL;

// Local dev fallback
const DEV_PORT = 3000;

const DEV_HOST =
  Platform.OS === "android"
    ? "10.0.2.2"
    : "localhost";

export const API_BASE = (ENV_BASE && ENV_BASE.length > 0)
  ? ENV_BASE.replace(/\/$/, "") // strip trailing slash
  : `http://${DEV_HOST}:${DEV_PORT}`;

console.log("[API] API_BASE =", API_BASE);