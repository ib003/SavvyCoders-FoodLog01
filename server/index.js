require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

// bearer auth
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  try { req.user = jwt.verify(t, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "unauthorized" }); }
}

// --- Auth ---
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email/password required" });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash } });
  const token = jwt.sign({ uid: user.id, email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) return res.status(400).json({ error: "bad credentials" });
  const ok = await bcrypt.compare(password, u.password);
  if (!ok) return res.status(400).json({ error: "bad credentials" });
  const token = jwt.sign({ uid: u.id, email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// --- Foods & barcode ---
app.get("/foods", async (req, res) => {
  const q = req.query.q || "";
  const foods = await prisma.food.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    take: 25,
  });
  res.json(foods);
});

app.get("/barcode/:upc", async (req, res) => {
  const b = await prisma.barcode.findUnique({
    where: { upc: req.params.upc },
    include: { food: true },
  });
  if (!b) return res.status(404).end();
  res.json(b.food);
});

// --- Meals ---
app.post("/meals", auth, async (req, res) => {
  const { occurred_at, meal_type, items } = req.body;
  if (!occurred_at || !meal_type || !Array.isArray(items)) {
    return res.status(400).json({ error: "invalid body" });
  }
  const meal = await prisma.meal.create({
    data: { userId: req.user.uid, occurredAt: new Date(occurred_at), mealType: meal_type },
  });
  if (items.length) {
    await prisma.mealItem.createMany({
      data: items.map(it => ({
        mealId: meal.id, foodId: it.food_id, qty: it.qty, overrides: it.overrides || {}
      }))
    });
  }
  res.json(meal);
});

app.get("/meals", auth, async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  const start = date ? new Date(`${date}T00:00:00Z`) : new Date("1970-01-01T00:00:00Z");
  const end   = date ? new Date(`${date}T23:59:59Z`) : new Date("2999-12-31T23:59:59Z");
  const meals = await prisma.meal.findMany({
    where: { userId: req.user.uid, occurredAt: { gte: start, lte: end } },
    include: { items: { include: { food: true } } },
    orderBy: { occurredAt: "desc" }
  });
  res.json(meals);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
