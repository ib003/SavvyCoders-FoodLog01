const FULL_URL = process.env.EXPO_PUBLIC_API_URL;
const HOST = process.env.EXPO_PUBLIC_API_HOST;
const PORT = process.env.EXPO_PUBLIC_API_PORT ?? "3000";

export const API_URL = FULL_URL
  ? FULL_URL
  : HOST
  ? `http://${HOST}:${PORT}`
  : undefined;

if (!API_URL) {
  console.warn(
    "API_URL is undefined. Check EXPO_PUBLIC_API_URL or EXPO_PUBLIC_API_HOST / EXPO_PUBLIC_API_PORT in .env"
  );
}