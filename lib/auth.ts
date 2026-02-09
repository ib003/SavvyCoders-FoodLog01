// lib/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../constants/api";

const fetchWithTimeout = (
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

const TOKEN_KEY = "auth_token";
const USER_EMAIL_KEY = "user_email";

export interface AuthResponse {
  token: string;
  email?: string;
  user?: { id: string; email: string; name?: string | null }; // optional if backend returns user
}

export const auth = {
  async checkServerConnection(): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/health`, { method: "GET" }, 2000);
      return res.ok;
    } catch {
      return false;
    }
  },

  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async saveUserEmail(email: string): Promise<void> {
    await AsyncStorage.setItem(USER_EMAIL_KEY, email);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) throw new Error("Email and password are required");

    const serverOk = await this.checkServerConnection();
    if (!serverOk) throw new Error("Cannot connect to server");

    const res = await fetchWithTimeout(
      `${API_BASE}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      },
      4000
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data?.error || data?.message || "Login failed");
    if (!data?.token) throw new Error("No token returned");

    await this.saveToken(data.token);
    await this.saveUserEmail(cleanEmail);

    return { token: data.token, email: cleanEmail, user: data.user };
  },

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !password || !cleanName) {
      throw new Error("Name, email, and password are required");
    }

    const serverOk = await this.checkServerConnection();
    if (!serverOk) throw new Error("Cannot connect to server");

    const res = await fetchWithTimeout(
      `${API_BASE}/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password, name: cleanName }),
      },
      4000
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data?.error || data?.message || "Unable to create account");
    if (!data?.token) throw new Error("No token returned");

    await this.saveToken(data.token);
    await this.saveUserEmail(cleanEmail);

    return { token: data.token, email: cleanEmail, user: data.user };
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async getUserEmail(): Promise<string | null> {
    return AsyncStorage.getItem(USER_EMAIL_KEY);
  },

  async isAuthenticated(): Promise<boolean> {
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