import { Platform } from "react-native";

const DEV_PORT = 3000;

const ENV_URL = process.env.EXPO_PUBLIC_API_BASE || process.env.EXPO_PUBLIC_API_URL;

const ANDROID_EMULATOR_HOST = `http://10.0.2.2:${DEV_PORT}`;
const IOS_SIMULATOR_HOST = `http://localhost:${DEV_PORT}`;

//Fallback for physical device testing (EDIT THIS TO YOUR OWN PC IP IF YOU ARE TESTING)
const LAN_FALLBACK_HOST = "";

export const API_BASE =
  ENV_URL ||
  (Platform.OS === "android" ? ANDROID_EMULATOR_HOST : LAN_FALLBACK_HOST) ||
  IOS_SIMULATOR_HOST;
console.log("[API] API_BASE =", API_BASE);
