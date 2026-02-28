import { Platform } from "react-native";

const DEV_PORT = 3000;

// Android emulator can't reach localhost; it uses 10.0.2.2
// iOS simulator can use localhost
// Physical device must use your computer's LAN IP
const DEV_HOST =
  Platform.OS === "android"
    ? "10.0.2.2"
    : "localhost";

// If you have a deployed API, set it here (or use env if your project supports it)
export const API_BASE = `http://${DEV_HOST}:${DEV_PORT}`;