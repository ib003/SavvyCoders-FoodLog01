import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../constants/api";

// Slight tweak: allow null instead of throwing immediately
async function readToken(): Promise<string | null> {
 return await AsyncStorage.getItem("token");
}

export type SavedFoodRow = {
  id: number;
  createdAt: string;
  food: any;
};

export async function getSavedFoods(): Promise<SavedFoodRow[]> {
  const token = await readToken();

  // If user isn't logged in yet, just return empty list
  if (!token) return [];

  const res = await fetch(`${API_BASE}/saved-foods`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveFood(food: any): Promise<{ id: number; food: any }> {
  const token = await readToken();

  if (!token) throw new Error("No token");
  const res = await fetch(`${API_BASE}/saved-foods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(food),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function removeSavedFood(
  savedId: number
): Promise<{ ok: true } | null> {
  const token = await readToken();

  // Same here — prevent unnecessary error popup
   if (!token) throw new Error("No token");

  const res = await fetch(`${API_BASE}/saved-foods/${savedId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}