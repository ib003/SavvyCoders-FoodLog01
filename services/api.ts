// app/services/api.ts

const DEV_API_BASE = "http://192.168.1.160:3000";
const PROD_API_BASE = "https://YOUR-PROD-API.com"; // later

const BASE_URL = __DEV__ ? DEV_API_BASE : PROD_API_BASE;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      (data && (data.error?.message || data.error || data.message)) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

// ---------- TYPES ----------
export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    photoUrl?: string | null;
    isVerified: boolean;
  };
};

// ---------- AUTH API ----------
export const api = {
  register: (email: string, password: string, name?: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  googleLogin: (idToken: string) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),
};

// ---------- AI API ----------
// If your server route is /ai/chat (NOT behind /api), keep "/ai/chat"
export const aiApi = {
  chat: (message: string) =>
    request<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};