// lib/foods.ts
import { API_BASE } from "@/constants/api";
import { auth } from "@/lib/auth";

export type Meal = {
  id: number | string;
  dateTime?: string;
  occurredAt?: string;
  mealType: string;
  note?: string | null;
  items?: any[];
};

async function readError(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : text;
  } catch {
    return text;
  }
}

export const foods = {
  async fetchMeals(date?: string): Promise<Meal[]> {
    const token = await auth.getToken();
    if (!token) throw new Error("Missing auth token");

    const qs = date ? `?date=${encodeURIComponent(date)}` : "";
    const res = await fetch(`${API_BASE}/api/meals${qs}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await readError(res);
      console.warn("Meals fetch failed:", res.status, body);
      throw new Error(`Meals fetch failed (${res.status})`);
    }

    return res.json();
  },
};