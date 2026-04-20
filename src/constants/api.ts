import { Platform } from "react-native";

const ENV_BASE = process.env.EXPO_PUBLIC_API_BASE?.trim();

const DEV_PORT = 3000;

const DEV_HOST =
  Platform.OS === "android"
    ? "10.0.2.2"
    : "localhost";

export const API_BASE =
  ENV_BASE && ENV_BASE.length > 0
    ? ENV_BASE.replace(/\/$/, "")
    : `http://${DEV_HOST}:${DEV_PORT}`;

console.log("[API] API_BASE =", API_BASE);