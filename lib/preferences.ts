import { API_BASE } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "./auth";

const PREFERENCES_KEY = "user_preferences";

export interface UserPreferences {
  allergies: string[];
  dietaryPreferences: string[];
}

export const COMMON_ALLERGENS = [
  "Peanuts",
  "Tree Nuts",
  "Dairy",
  "Eggs",
  "Gluten",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
  "Lactose",
  "Sulfites",
];

export const COMMON_DIETARY_PREFERENCES = [
  "Vegan",
  "Vegetarian",
  "Halal",
  "Kosher",
  "Paleo",
  "Keto",
  "Gluten-Free",
  "Dairy-Free",
  "Sugar-Free",
  "Low-Carb",
  "Low-Fat",
];

async function readErrorBody(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : text;
  } catch {
    return text;
  }
}

export const preferences = {
  async loadLocal(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to load local preferences:", e);
    }
    return { allergies: [], dietaryPreferences: [] };
  },

  async saveLocal(prefs: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error("Failed to save local preferences:", e);
    }
  },

  async fetch(): Promise<UserPreferences> {
    try {
      const token = await auth.getToken();
      if (!token) return await this.loadLocal();

      const res = await fetch(`${API_BASE}/api/user/preferences`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        await auth.logout();
        return await this.loadLocal();
      }

      if (!res.ok) {
        const body = await readErrorBody(res);
        console.error("Fetch preferences failed:", res.status, body);
        return await this.loadLocal();
      }

      const data = (await res.json()) as UserPreferences;
      await this.saveLocal(data);
      return data;
    } catch (e) {
      console.error("Failed to fetch preferences:", e);
      return await this.loadLocal();
    }
  },

  async save(prefs: UserPreferences): Promise<void> {
    await this.saveLocal(prefs);

    try {
      const token = await auth.getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/user/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prefs),
      });

      if (res.status === 401) {
        await auth.logout();
        return;
      }

      if (!res.ok) {
        const body = await readErrorBody(res);
        console.error("Save preferences failed:", res.status, body);
        throw new Error("Failed to save preferences");
      }
    } catch (e) {
      console.error("Failed to save preferences:", e);
    }
  },
};