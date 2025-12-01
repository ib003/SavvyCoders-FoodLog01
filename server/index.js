require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

let dataUrl = image
if (!dataUrl.startsWith("data:"))
{
dataUrl = "data:image/jpeg;base64," + dataUrl
}

//this object will hold the final ai estimate for the food in the picture
let result =
{
name: "unknown food",
calories: 0,
protein: 0,
carbs: 0,
fat: 0,
ingredients: []
}

try
{
//this is the prompt i give ChatGPT to get the estimate  
const promptText = "you see a photo of food. estimate the dish name, total calories, grams of protein, grams of carbs, grams of fat, and a short list of ingredients. respond only with json using keys name, calories, protein, carbs, fat, ingredients where ingredients is an array of strings"

const aiRes = await openai.responses.create({
//using older model cause it's free
model: "gpt-4.1-mini",
input: [
{
role: "user",
content: [
{ type: "input_text", text: promptText },
{ type: "input_image", image_url: dataUrl }
]
}
],
response_format: { type: "json_object" }
})

let aiText = null

//this if statement checks if the output i got from ChatGPT is in the right format/is usable
if (aiRes && aiRes.output && aiRes.output[0] && aiRes.output[0].content && aiRes.output[0].content[0] && aiRes.output[0].content[0].text)
{
aiText = aiRes.output[0].content[0].text
}

//if aitext is not null, that means the previous check was fine
if (aiText)
{
try
{
const parsed = JSON.parse(aiText)
result.name = parsed.name || result.name
result.calories = parsed.calories || result.calories
result.protein = parsed.protein || result.protein
result.carbs = parsed.carbs || result.carbs
result.fat = parsed.fat || result.fat
result.ingredients = parsed.ingredients || result.ingredients
}
catch (e)
{
console.error("json parse error", e)
}
}
}
catch (err)
{
console.error("ai error", err)
}
//stuff above is just broad error catching
if (!result || !result.name)
{
return res.status(500).json({ error: "ai failed to analyze image" })
}

//this function normalizes what the ai gave us to usable food object
function normalizeFood(result)
{
  if (!result)
  {
  return null
  }
  
  if (typeof result !== "object")
{
return null
}

let calories = Number(result.calories)
//all of these if statements below just make sure the avlues they get are positive, usable numbers
if (isNaN(calories) || calories < 0)
{
calories = 0
}

let protein = Number(result.protein)
if (isNaN(protein) || protein < 0)
{
protein = 0
}

let carbs = Number(result.carbs)
if (isNaN(carbs) || carbs < 0)
{
carbs = 0
}

let fat = Number(result.fat)
if (isNaN(fat) || fat < 0)
{
fat = 0
}

let ingredients = []
if (Array.isArray(result.ingredients))
{
ingredients = result.ingredients.map((item) =>
{
if (typeof item === "string")
{
return item
}
return String(item)
})
}

//we aren't using result.value for these values anymore because they all got tested and if need be, cleaned in the if statements above
return {
name: result.name || "unknown",
calories: calories,
protein: protein,
carbs: carbs,
fat: fat,
ingredients: ingredients
}
}

//this function saves the normalized food to the database so we can reuse it later
async function saveFood(food)
{
if (!food || !food.name)
{
return null
}

let saved = null

try
{
saved = await prisma.food.create({
data:
{
name: food.name,
calories: food.calories
}
})
}
catch (e)
{
console.error("db error", e)
return null
}

return saved
}

//in case normalizeFood returns NULL, we return an error message
const clean = normalizeFood(result)

if (!clean)
{
return res.status(500).json({ error: "ai result invalid" })
}

const saved = await saveFood(clean)

res.json(saved || clean)
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
