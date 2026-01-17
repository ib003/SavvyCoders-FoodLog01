import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../constants/api";

// ---------- helpers ----------
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout = 4000
): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);
};

// ---------- storage keys ----------
const TOKEN_KEY = "auth_token";
const USER_EMAIL_KEY = "user_email";

// ---------- types ----------
export interface AuthResponse {
  token: string;
  email?: string;
}

// ---------- auth ----------
export const auth = {
  async checkServerConnection(): Promise<boolean> {
    try {
      const res = await Promise.race([
        fetch(`${API_BASE}/health`),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 2000)
        ),
      ]);
      return res.ok;
    } catch {
      return false;
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      throw new Error("Email and password are required");
    }

    const serverOk = await this.checkServerConnection();
    if (!serverOk) {
      throw new Error("Cannot connect to server");
    }

    const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || data?.message || "Login failed");
    }

    if (!data.token) {
      throw new Error("No token returned");
    }

    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_EMAIL_KEY, cleanEmail);

    return { token: data.token, email: cleanEmail };
  },

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !password || !cleanName) {
      throw new Error("Name, email, and password are required");
    }

    const serverOk = await this.checkServerConnection();
    if (!serverOk) {
      throw new Error("Cannot connect to server");
    }

    const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password, name: cleanName }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || data?.message || "Unable to create account");
    }

    if (!data.token) {
      throw new Error("No token returned");
    }

    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_EMAIL_KEY, cleanEmail);

    return { token: data.token, email: cleanEmail };
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async getUserEmail(): Promise<string | null> {
    return AsyncStorage.getItem(USER_EMAIL_KEY);
  },

  async isAuthenticated() {
  const token = await this.getToken();
  return !!token && token.length >= 10;
},

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_EMAIL_KEY]);
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_EMAIL_KEY]);
  },
};