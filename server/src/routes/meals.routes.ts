// server/src/routes/meals.routes.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// UI sends: Breakfast/Lunch/Dinner/Snack -> backend expects enum values
const VALID_MEAL_TYPES = new Set(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"]);

router.post("/meals", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.sub as string;

    const { title, notes, mealType, dateTime } = req.body as {
      title?: string;
      notes?: string | null;
      mealType?: string;
      dateTime?: string;
    };

    if (!title?.trim()) return res.status(400).json({ error: "Meal name required" });
    if (!mealType || !VALID_MEAL_TYPES.has(mealType)) {
      return res.status(400).json({ error: "Invalid mealType" });
    }

    const meal = await prisma.meal.create({
      data: {
        userId,
        mealType: mealType as any, // Prisma enum
        note: notes?.trim() ? notes.trim() : null,
        dateTime: dateTime ? new Date(dateTime) : new Date(),

        items: {
          create: [
            {
              quantity: 1,
              food: {
                create: {
                  name: title.trim(),
                  source: "MANUAL",
                },
              },
            },
          ],
        },
      },
      include: { items: { include: { food: true } } },
    });

    return res.status(201).json(meal);
  } catch (e) {
    console.error("POST /meals error:", e);
    return res.status(500).json({ error: "Failed to create meal" });
  }
});

router.get("/meals", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.sub as string;

    const meals = await prisma.meal.findMany({
      where: { userId },
      orderBy: { dateTime: "desc" },
      include: { items: { include: { food: true } } },
      take: 100,
    });

    return res.json(meals);
  } catch (e) {
    console.error("GET /meals error:", e);
    return res.status(500).json({ error: "Failed to load meals" });
  }
});

export default router;