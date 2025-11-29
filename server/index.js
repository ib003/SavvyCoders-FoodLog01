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
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const hash = await bcrypt.hash(password, 10);
    
    try {
      const user = await prisma.user.create({ 
        data: { 
          email: email.trim().toLowerCase(), 
          password: hash,
          allergies: [],
          dietaryPreferences: []
        } 
      });
      const token = jwt.sign({ uid: user.id, email: user.email }, process.env.JWT_SECRET || "fallback-secret-key", { expiresIn: "7d" });
      res.json({ token, email: user.email });
    } catch (prismaError) {
      // Handle unique constraint violation (email already exists)
      if (prismaError.code === "P2002" && prismaError.meta?.target?.includes("email")) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }
      console.error("Prisma error:", prismaError);
      return res.status(500).json({ error: "Failed to create account. Please try again." });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const u = await prisma.user.findUnique({ 
      where: { email: email.trim().toLowerCase() } 
    });
    
    if (!u) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    
    const ok = await bcrypt.compare(password, u.password);
    
    if (!ok) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    
    const token = jwt.sign(
      { uid: u.id, email: u.email }, 
      process.env.JWT_SECRET || "fallback-secret-key", 
      { expiresIn: "7d" }
    );
    
    res.json({ token, email: u.email });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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

// --- AI Food Analysis ---
app.post("/api/analyze-food", async (req, res) =>
{
const image = req.body.image

if (!image)
{
return res.status(400).json({ error: "missing image" })
}

//TODO: send image to chatgpt api and receive analysis result
let result =
{
name: "unknown food",
calories: 0,
ingredients: []
}

res.json(result)
})

// --- User Preferences ---
app.get("/user/preferences", auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.uid },
    select: { allergies: true, dietaryPreferences: true },
  });
  if (!user) return res.status(404).json({ error: "user not found" });
  res.json({ allergies: user.allergies || [], dietaryPreferences: user.dietaryPreferences || [] });
});

app.put("/user/preferences", auth, async (req, res) => {
  const { allergies, dietaryPreferences } = req.body;
  if (!Array.isArray(allergies) || !Array.isArray(dietaryPreferences)) {
    return res.status(400).json({ error: "allergies and dietaryPreferences must be arrays" });
  }
  const user = await prisma.user.update({
    where: { id: req.user.uid },
    data: { allergies, dietaryPreferences },
    select: { allergies: true, dietaryPreferences: true },
  });
  res.json(user);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
