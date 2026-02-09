// server/src/api/foods.routes.ts
import express from "express";
import { PrismaClient, FoodSource } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/foods?q=milk
 *
 * Behavior:
 * - Searches OpenFoodFacts
 * - Upserts foods into your DB by barcode
 * - Returns foods with id = DB Food.id (number) as string (safe for RN)
 */
router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json([]);

    const url =
      "https://world.openfoodfacts.org/cgi/search.pl" +
      `?search_terms=${encodeURIComponent(q)}` +
      "&search_simple=1&action=process&json=1&page_size=20";

    const r = await fetch(url);
    const data: any = await r.json();

    const products: any[] = Array.isArray(data?.products) ? data.products : [];
    if (products.length === 0) return res.json([]);

    // Upsert each product into DB so frontend gets a real Food.id (Int)
    const foods = await Promise.all(
      products.map(async (p: any) => {
        const barcode = String(p.code ?? p._id ?? p.id ?? "").trim();
        const name = String(p.product_name ?? p.generic_name ?? "Unknown food").trim();
        const brand = p.brands ? String(p.brands).trim() : null;

        // If no barcode, we still create a DB entry with a generated externalId
        // (Better than returning empty id)
        const hasBarcode = !!barcode;

        const dbFood = await prisma.food.upsert({
          where: hasBarcode ? { barcode } : { barcode: "__never__matches__" }, // dummy where if no barcode
          update: {
            name: name || "Unknown food",
            brand: brand || undefined,
            source: FoodSource.UPC_API,
          },
          create: {
            name: name || "Unknown food",
            brand: brand || undefined,
            barcode: hasBarcode ? barcode : undefined,
            source: FoodSource.UPC_API,
            externalId: hasBarcode ? barcode : `off:${Math.random().toString(36).slice(2)}`,
          },
          select: {
            id: true,
            name: true,
            brand: true,
            barcode: true,
            calories: true,
            protein: true,
            carbs: true,
            fat: true,
          },
        });

        return {
          id: String(dbFood.id),          // ✅ DB Food.id (Int) returned as string
          name: dbFood.name,
          brand: dbFood.brand ?? "",
          servingUnit: "g",
          servingQty: 100,
          kcal: dbFood.calories ?? undefined,
          macros: {
            protein: dbFood.protein ?? undefined,
            carbs: dbFood.carbs ?? undefined,
            fat: dbFood.fat ?? undefined,
          },
          barcode: dbFood.barcode ?? undefined,
        };
      })
    );

    return res.json(foods);
  } catch (err) {
    console.error("foods search error:", err);
    return res.status(500).json({ error: "Failed to search foods" });
  }
});

export default router;