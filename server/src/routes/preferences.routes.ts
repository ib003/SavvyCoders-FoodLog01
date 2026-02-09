// server/src/routes/preferences.routes.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// GET /api/user/preferences
router.get("/preferences", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.sub as string;

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { allergies: true, dietaryPreferences: true },
    });

    return res.json(prefs ?? { allergies: [], dietaryPreferences: [] });
  } catch (e: any) {
    console.error("GET /preferences error:", e?.message || e);
    return res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// PUT /api/user/preferences
router.put("/preferences", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.sub as string;

    const allergies = Array.isArray(req.body?.allergies) ? req.body.allergies : [];
    const dietaryPreferences = Array.isArray(req.body?.dietaryPreferences)
      ? req.body.dietaryPreferences
      : [];

    const saved = await prisma.userPreferences.upsert({
      where: { userId },
      update: { allergies, dietaryPreferences },
      create: { userId, allergies, dietaryPreferences },
      select: { allergies: true, dietaryPreferences: true },
    });

    return res.json(saved);
  } catch (e: any) {
    console.error("PUT /preferences error:", e?.message || e);
    return res.status(500).json({ error: "Failed to save preferences" });
  }
});

export default router;