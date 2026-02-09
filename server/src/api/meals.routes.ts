// server/src/api/meals.routes.ts
import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, MealType, FoodSource } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

/**
 * Minimal auth middleware:
 * Expects: Authorization: Bearer <JWT>
 * JWT payload contains: { sub: userId, email, name, ... }
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) return res.status(401).json({ error: "Missing Authorization token" });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server misconfigured: JWT_SECRET missing" });
    }

    const decoded = jwt.verify(token, secret) as any;

    if (!decoded?.sub) return res.status(401).json({ error: "Invalid token payload" });

    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function normalizeMealType(input: string): MealType {
  const v = String(input || "").trim().toUpperCase();
  if (v === "BREAKFAST") return MealType.BREAKFAST;
  if (v === "LUNCH") return MealType.LUNCH;
  if (v === "DINNER") return MealType.DINNER;
  if (v === "SNACK") return MealType.SNACK;
  return MealType.OTHER;
}

/**
 * Resolve the authenticated user in DB.
 * - Prefer lookup by email (most stable, avoids mismatched sub)
 * - If missing, create a user row using sub as id
 */
async function getOrCreateUserFromToken(decoded: any) {
  const tokenSub = String(decoded?.sub || "").trim();
  const tokenEmail = decoded?.email ? String(decoded.email).trim().toLowerCase() : null;
  const tokenName = decoded?.name ? String(decoded.name).trim() : null;

  if (!tokenSub) throw new Error("Token missing sub");

  // 1) If email exists, prefer finding by email (email is unique)
  if (tokenEmail) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: tokenEmail },
      select: { id: true, email: true },
    });

    if (existingByEmail) return existingByEmail.id;

    // If email not found, create user using token sub
    await prisma.user.create({
      data: {
        id: tokenSub,
        email: tokenEmail,
        name: tokenName || undefined,
        // passwordHash null allowed
      },
    });

    return tokenSub;
  }

  // 2) No email in token: fall back to sub
  const existingById = await prisma.user.findUnique({
    where: { id: tokenSub },
    select: { id: true },
  });

  if (existingById) return tokenSub;

  // Create placeholder user (email required by schema, so this only works if your token includes email)
  // If your token truly has no email, you MUST include email in token generation.
  throw new Error("Token missing email; cannot create user");
}

/**
 * GET /api/meals
 * Optional query: ?limit=20
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const userId = await getOrCreateUserFromToken(decoded);

    const limit = Math.min(Number(req.query.limit || 50), 100);

    const meals = await prisma.meal.findMany({
      where: { userId },
      orderBy: { dateTime: "desc" },
      take: limit,
      include: {
        items: { include: { food: true } },
      },
    });

    return res.json(meals);
  } catch (err) {
    console.error("GET /api/meals error:", err);
    return res.status(500).json({ error: "Failed to fetch meals" });
  }
});

/**
 * POST /api/meals
 * Body:
 * {
 *   occurred_at: ISO string,
 *   meal_type: "breakfast" | "lunch" | "dinner" | "snack" | "other",
 *   items: [{ food_id: string|number, qty: number|string, food?: {...optional} }]
 * }
 *
 * IMPORTANT:
 * - food_id should be DB Food.id (int). (Your updated foods route now returns this)
 * - If frontend accidentally sends barcode, we try to resolve by barcode.
 * - If still missing and food object is provided, we create Food.
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const decoded = (req as any).user;
    const userId = await getOrCreateUserFromToken(decoded);

    const { occurred_at, meal_type, items } = req.body ?? {};

    if (!occurred_at || !meal_type || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid meal data" });
    }

    const dateTime = new Date(occurred_at);
    if (isNaN(dateTime.getTime())) {
      return res.status(400).json({ error: "Invalid occurred_at date" });
    }

    // Resolve each item into a real DB Food.id + quantity
    const resolvedItems: Array<{ foodId: number; quantity: number }> = [];

    for (const it of items) {
      const qtyNum = Number(it?.qty ?? 1);
      if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
        return res.status(400).json({ error: "Invalid qty in items" });
      }

      const rawFoodId = it?.food_id;

      // Try as DB id first
      let foodIdNum = Number(rawFoodId);
      let food = Number.isFinite(foodIdNum)
        ? await prisma.food.findUnique({ where: { id: foodIdNum } })
        : null;

      // If not found, treat it like barcode and try find by barcode
      if (!food && rawFoodId != null) {
        const barcode = String(rawFoodId).trim();
        if (barcode) {
          food = await prisma.food.findUnique({ where: { barcode } });
        }
      }

      // If still not found, create from provided food payload (optional)
      if (!food && it?.food?.name) {
        const name = String(it.food.name).trim();
        const brand = it.food.brand ? String(it.food.brand).trim() : undefined;
        const barcode = it.food.barcode ? String(it.food.barcode).trim() : undefined;

        food = await prisma.food.create({
          data: {
            name: name || "Unknown food",
            brand,
            barcode: barcode || undefined,
            source: FoodSource.MANUAL,
          },
        });
      }

      if (!food) {
        return res.status(400).json({
          error:
            "Unknown food. Please re-search and select the food again (so we get the DB id).",
        });
      }

      resolvedItems.push({ foodId: food.id, quantity: qtyNum });
    }

    const created = await prisma.meal.create({
      data: {
        userId,
        dateTime,
        mealType: normalizeMealType(meal_type),
        items: {
          create: resolvedItems.map((i) => ({
            foodId: i.foodId,
            quantity: i.quantity,
          })),
        },
      },
      include: {
        items: { include: { food: true } },
      },
    });

    return res.json({ success: true, meal: created });
  } catch (err: any) {
    console.error("POST /api/meals error:", err);
    return res.status(500).json({ error: "Failed to save meal" });
  }
});

export default router;