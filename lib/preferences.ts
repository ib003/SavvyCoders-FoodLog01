import { API_BASE } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "./auth";

const PREFERENCES_KEY = "user_preferences";

export interface UserPreferences {
  allergies: string[];
  dietaryPreferences: string[];
}

// Common allergens list
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

// Common dietary preferences/tags
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

export const preferences = {
  // Load preferences from local storage
  async loadLocal(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return { allergies: [], dietaryPreferences: [] };
    } catch (e) {
      console.error("Failed to load local preferences:", e);
      return { allergies: [], dietaryPreferences: [] };
    }
  },

  // Save preferences to local storage
  async saveLocal(prefs: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error("Failed to save local preferences:", e);
    }
  },

  // Fetch preferences from backend
  async fetch(): Promise<UserPreferences> {
    try {
      const token = await auth.getToken();
      if (!token) {
        // If not authenticated, return local preferences
        return await this.loadLocal();
      }

      const response = await fetch(`${API_BASE}/user/preferences`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // If API fails, return local preferences
        return await this.loadLocal();
      }

      const data = await response.json();
      // Sync with local storage
      await this.saveLocal(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
      return await this.loadLocal();
    }
  },

  // Save preferences to backend
  async save(prefs: UserPreferences): Promise<void> {
    try {
      // Save locally first for offline support
      await this.saveLocal(prefs);

      const token = await auth.getToken();
      if (!token) {
        // If not authenticated, only save locally
        return;
      }

      const response = await fetch(`${API_BASE}/user/preferences`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prefs),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
      // Preferences are saved locally, so they'll sync later
    }
  },
};

