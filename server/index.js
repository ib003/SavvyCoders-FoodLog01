require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const jwksClient = require("jwks-rsa");
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const FDC_API_KEY = process.env.FDC_API_KEY;

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Initialize Apple JWKS client for token verification
const appleJwksClient = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

// Helper function to get Apple signing key
function getAppleKey(header, callback) {
  appleJwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Helper function to verify Apple identity token
async function verifyAppleToken(identityToken) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      identityToken,
      getAppleKey,
      {
        algorithms: ["RS256"],
        issuer: "https://appleid.apple.com",
        audience: process.env.APPLE_CLIENT_ID || process.env.APPLE_BUNDLE_ID,
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

function toFoodResponse(food) {
  if (!food) return food;
  const servingQty = food.servingQty ?? food.servingSize ?? null;
  const servingUnit = food.servingUnit ?? null;
  const kcal = food.kcal ?? food.calories ?? null;
  return { ...food, servingQty, servingUnit, kcal };
}

// bearer auth middleware
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!t) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    const decoded = jwt.verify(t, process.env.JWT_SECRET || "fallback-secret-key");
    req.userId = decoded.userId; // Use userId consistently
    next();
  } catch (error) {
    return res.status(401).json({ error: "unauthorized" });
  }
}

// --- Auth ---
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("[REGISTER] Attempt for email:", email ? email.trim().toLowerCase() : "missing");
    
    if (!email || !password) {
      console.log("[REGISTER] Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      console.log("[REGISTER] Invalid email format:", normalizedEmail);
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 8) {
      console.log("[REGISTER] Password too short:", password.length);
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    console.log("[REGISTER] Hashing password...");
    const passwordHash = await bcrypt.hash(password, 12);
    console.log("[REGISTER] Password hashed, length:", passwordHash.length);
    
    try {
      console.log("[REGISTER] Creating user in database...");
      const user = await prisma.user.create({ 
        data: { 
          email: normalizedEmail, 
          passwordHash: passwordHash,
          googleSub: null,
          appleSub: null,
        },
        select: {
          id: true,
          email: true,
          createdAt: true
        }
      });
      console.log("[REGISTER] User created successfully:", { id: user.id, email: user.email });
      
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "fallback-secret-key", { expiresIn: "7d" });
      console.log("[REGISTER] JWT token generated");
      res.json({ token, user: { id: user.id, email: user.email } });
    } catch (prismaError) {
      // Handle unique constraint violation (email already exists)
      if (prismaError.code === "P2002" && prismaError.meta?.target?.includes("email")) {
        console.log("[REGISTER] Email already exists:", normalizedEmail);
        return res.status(400).json({ error: "An account with this email already exists" });
      }
      console.error("[REGISTER] Prisma error:", prismaError);
      return res.status(500).json({ error: "Failed to create account. Please try again." });
    }
  } catch (error) {
    console.error("[REGISTER] Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? email.trim().toLowerCase() : null;
    console.log("[LOGIN] Attempt for email:", normalizedEmail || "missing");
    
    if (!email || !password) {
      console.log("[LOGIN] Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    console.log("[LOGIN] Looking up user in database...");
    const user = await prisma.user.findUnique({ 
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true
      }
    });
    
    if (!user) {
      console.log("[LOGIN] User not found for email:", normalizedEmail);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    if (!user.passwordHash) {
      console.log("[LOGIN] User has no passwordHash (OAuth account):", user.email);
      return res.status(401).json({ error: "Please sign in with Google/Apple for this account" });
    }
    
    console.log("[LOGIN] User found:", { id: user.id, email: user.email });
    console.log("[LOGIN] Comparing password...");
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    console.log("[LOGIN] Password match:", passwordValid);
    
    if (!passwordValid) {
      console.log("[LOGIN] Password mismatch for user:", user.email);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    console.log("[LOGIN] Generating JWT token...");
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET || "fallback-secret-key", 
      { expiresIn: "7d" }
    );
    console.log("[LOGIN] Login successful for user:", user.email);
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email } 
    });
  } catch (error) {
    console.error("[LOGIN] Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- OAuth Endpoints ---
app.post("/auth/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }

    console.log("[GOOGLE OAUTH] Verifying Google idToken...");
    
    // Verify the Google idToken
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const { sub: googleSub, email, name, picture } = payload;
    console.log("[GOOGLE OAUTH] Token verified for:", email);

    if (!email) {
      return res.status(400).json({ error: "Email not provided by Google" });
    }

    // Upsert user in database - check by googleSub first, then email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleSub: googleSub },
          { email: email.toLowerCase() }
        ]
      },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: email.toLowerCase(),
          googleSub: googleSub,
          name: name || undefined,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          googleSub: googleSub,
          name: name || undefined,
          passwordHash: null,
          appleSub: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    }

    console.log("[GOOGLE OAUTH] User upserted:", user.email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "fallback-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("[GOOGLE OAUTH] Error:", error);
    console.error("[GOOGLE OAUTH] Error message:", error.message);
    console.error("[GOOGLE OAUTH] Error stack:", error.stack);
    if (error.message?.includes("Invalid token") || error.message?.includes("Token used too early")) {
      return res.status(401).json({ error: "Invalid Google token: " + error.message });
    }
    res.status(500).json({ error: "OAuth authentication failed: " + error.message });
  }
});

app.post("/auth/apple", async (req, res) => {
  try {
    const { identityToken, authorizationCode, user } = req.body;
    
    if (!identityToken) {
      return res.status(400).json({ error: "identityToken is required" });
    }

    console.log("[APPLE OAUTH] Verifying Apple identityToken...");

    // Verify Apple identity token using JWKS
    let applePayload;
    try {
      applePayload = await verifyAppleToken(identityToken);
      console.log("[APPLE OAUTH] Token verified successfully");
    } catch (error) {
      console.error("[APPLE OAUTH] Token verification error:", error);
      console.error("[APPLE OAUTH] Error details:", error.message);
      return res.status(401).json({ error: "Invalid Apple token: " + error.message });
    }

    const { sub: appleSub, email } = applePayload;
    console.log("[APPLE OAUTH] Token verified for:", email || "no email", "sub:", appleSub);

    // Apple may not provide email in subsequent logins
    // Use the email from the user object if provided, or from token
    const userEmail = user?.email || email;
    if (!userEmail && !appleSub) {
      return res.status(400).json({ error: "Email or Apple ID not provided" });
    }

    // Upsert user in database - check by appleSub first, then email
    const whereConditions = [];
    if (appleSub) {
      whereConditions.push({ appleSub: appleSub });
    }
    if (userEmail) {
      whereConditions.push({ email: userEmail.toLowerCase() });
    }
    
    let dbUser = whereConditions.length > 0 
      ? await prisma.user.findFirst({
          where: {
            OR: whereConditions,
          },
        })
      : null;

    if (dbUser) {
      // Update existing user
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          ...(userEmail && { email: userEmail.toLowerCase() }),
          appleSub: appleSub,
          name: user?.fullName?.givenName || user?.fullName?.familyName 
            ? `${user.fullName.givenName || ''} ${user.fullName.familyName || ''}`.trim()
            : undefined,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    } else {
      // Create new user
      dbUser = await prisma.user.create({
        data: {
          email: userEmail ? userEmail.toLowerCase() : `apple_${appleSub}@apple.local`,
          appleSub: appleSub,
          name: user?.fullName?.givenName || user?.fullName?.familyName 
            ? `${user.fullName.givenName || ''} ${user.fullName.familyName || ''}`.trim()
            : undefined,
          passwordHash: null,
          googleSub: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    }

    console.log("[APPLE OAUTH] User upserted:", dbUser.email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: dbUser.id },
      process.env.JWT_SECRET || "fallback-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
    });
  } catch (error) {
    console.error("[APPLE OAUTH] Error:", error);
    console.error("[APPLE OAUTH] Error message:", error.message);
    console.error("[APPLE OAUTH] Error stack:", error.stack);
    if (error.message?.includes("Invalid token") || error.message?.includes("jwt expired")) {
      return res.status(401).json({ error: "Invalid Apple token: " + error.message });
    }
    res.status(500).json({ error: "OAuth authentication failed: " + error.message });
  }
});

// --- Foods & barcode ---
app.get("/foods", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);

  //If a real FDC_API_KEY is set in .env, search USDA FoodData Central (real nutrition DB)
  if (FDC_API_KEY) {
    try {
      const url =
        "https://api.nal.usda.gov/fdc/v1/foods/search?api_key=" +
        encodeURIComponent(FDC_API_KEY);

      const fdcResp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, pageSize: 25, pageNumber: 1 }),
      });

      if (!fdcResp.ok) {
        const txt = await fdcResp.text();
        console.error("[/foods] FDC error:", fdcResp.status, txt.slice(0, 300));
        return res.status(502).json([]);
      }

      const payload = await fdcResp.json();
      const list = Array.isArray(payload.foods) ? payload.foods : [];

      const candidates = list
        .map((f) => {
          const nutrients = Array.isArray(f.foodNutrients) ? f.foodNutrients : [];
          const energy = nutrients.find((n) =>
            String(n?.nutrientName || "").toLowerCase().includes("energy")
          );

          let calories = (energy && typeof energy.value === "number") ? energy.value : null;
          const unit = String(energy?.unitName || "").toUpperCase();
          if (typeof calories === "number" && unit === "KJ") calories = calories / 4.184; // kJ -> kcal

          const servingSize = (typeof f.servingSize === "number") ? f.servingSize : null;
          const servingUnit = f.servingSizeUnit ? String(f.servingSizeUnit) : null;

          return {
            //exactly like the model Food fields
            name: String(f.description || ""),
            brand: f.brandOwner || f.brandName || null,
            description: null,
            servingSize: servingSize,
            servingUnit: servingUnit || null,
            calories: (typeof calories === "number") ? Math.round(calories) : null,
            barcode: null,
            imageUrl: null,
            source: "UPC_API",
            externalId: f.fdcId ? String(f.fdcId) : null,
            servingQty: servingSize,
            kcal: (typeof calories === "number") ? Math.round(calories) : null,
          };
        })
        .filter((x) => x.name);

      //Cache to DB so later /meals can reference a real Food id
      //If DB is down, we still return the external results
      try {
        const saved = [];
        for (const c of candidates) {
          if (!c.externalId) continue;
          let existing = await prisma.food.findFirst({
            where: { source: "FDC_API", externalId: c.externalId },
          });
          if (!existing) existing = await prisma.food.create({ data: c });
          saved.push(existing);
        }
        const result = saved.length ? saved.map(toFoodResponse) : candidates.map(toFoodResponse);
        return res.json(result);
      } catch (dbErr) {
        console.error("[/foods] DB cache failed, returning external results:", dbErr?.message || dbErr);
        return res.json(candidates.map(toFoodResponse));
      }
    } catch (err) {
      console.error("[/foods] External search failed:", err);
      return res.status(502).json([]);
    }
  }

  //Fallback: local DB search
  const foods = await prisma.food.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    take: 25,
  });
  res.json(foods.map(toFoodResponse));
});

app.get("/barcode/:upc", async (req, res) => {
  try {
    const upc = req.params.upc;

    // Try to find an existing Food by its barcode
    let food = await prisma.food.findUnique({ where: { barcode: upc } });
    if (food) {
      return res.json(toFoodResponse(food));
    }

    // If not found locally, try OpenFoodFacts (public UPC/product database)
    // Example: https://world.openfoodfacts.org/api/v0/product/737628064502.json
    const ofUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(upc)}.json`;
    const ofResp = await fetch(ofUrl);
    if (!ofResp.ok) {
      return res.status(404).end();
    }
    const ofData = await ofResp.json();
    if (ofData.status !== 1 || !ofData.product) {
      return res.status(404).end();
    }

    const p = ofData.product;
    const name = p.product_name || p.generic_name || p.name || `Product ${upc}`;
    const brand = p.brands || null;

    // Try to get calories per serving or per 100g
    const nutr = p.nutriments || {};
    const kcal = (
      nutr['energy-kcal_serving'] ?? nutr['energy-kcal_100g'] ?? nutr['energy_serving'] ?? nutr['energy_100g'] ?? null
    );

    // Use serving_size as a human readable unit (e.g., "100 g" or "1 serving")
    const servingSizeRaw = p.serving_size || null;

    // Create a new Food record from the external product
    const created = await prisma.food.create({
      data: {
        name: name,
        brand: brand,
        description: p.generic_name || p.labels || null,
        servingSize: null,
        servingUnit: servingSizeRaw,
        calories: kcal ? Number(kcal) : null,
        barcode: upc,
        imageUrl: p.image_front_small_url || p.image_url || null,
        source: 'UPC_API',
        externalId: p.code || null,
      },
    });

    return res.json(toFoodResponse(created));
  } catch (err) {
    console.error('Barcode lookup error:', err);
    return res.status(500).json({ error: 'Failed to lookup barcode' });
  }
});


app.post("/barcode/decode", async (req, res) => {

  res.status(501).json({
    error: "not_implemented",
    message:
      "Image barcode decoding is not implemented on this server.\n" +
      "You can either: (1) POST to a third-party barcode-decoding API,\n" +
      "(2) implement a decoder here (e.g., using zxing-js + canvas or zbar),\n" +
      "or (3) send the numeric barcode string to GET /barcode/:code instead.",
  });
});

// --- Meals ---
// --- Auth Me Endpoint ---
app.get("/auth/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Auth me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/meals", auth, async (req, res) => {
  try {
    const { occurred_at, meal_type, note, items } = req.body;
    if (!occurred_at || !meal_type || !Array.isArray(items)) {
      return res.status(400).json({ error: "invalid body" });
    }

    //normalize meal strings
    const mealTypeMap = {
      breakfast: "BREAKFAST",
      lunch: "LUNCH",
      dinner: "DINNER",
      snack: "SNACK",
      snacks: "SNACK",
    };
    const mealTypeKey = String(meal_type).trim().toLowerCase();
    const normalizedMealType = mealTypeMap[mealTypeKey] || String(meal_type).trim();

    const meal = await prisma.meal.create({
      data: {
        userId: req.userId,
        dateTime: new Date(occurred_at),
        mealType: normalizedMealType,
        note: note || null
      },
    });

if (items.length) {
  const rows = [];

  for (const it of items) {
    let foodId = it.food_id ?? it.foodId;
    if (foodId != null && !Number.isFinite(Number(foodId))) {
      foodId = null;
    }
    if (foodId != null) {
      foodId = Number(foodId);
    }

    //If client didn't send a real Food.id, resolve/create by externalId or name
    if (foodId == null) {
      const externalId = it.externalId ?? it.external_id ?? null;
      const name = it.name ?? null;
      const brand = it.brand ?? null;
      const kcal = it.kcal ?? it.calories ?? null;

      let food = null;

      if (externalId) {
        food = await prisma.food.findFirst({
          where: { externalId: String(externalId) },
        });

        if (!food) {
          food = await prisma.food.create({
            data: {
              name: name || `Food ${externalId}`,
              brand: brand,
              calories: kcal != null ? Number(kcal) : null,
              source: "UPC_API",
              externalId: String(externalId),
            },
          });
        }
      } else if (name) {
        //fallback: match by name/brand, else create
        food = await prisma.food.findFirst({
          where: {
            name: { equals: String(name), mode: "insensitive" },
            ...(brand ? { brand: { equals: String(brand), mode: "insensitive" } } : {}),
          },
        });

        if (!food) {
          food = await prisma.food.create({
            data: {
              name: String(name),
              brand: brand,
              calories: kcal != null ? Number(kcal) : null,
              source: "UPC_API",
              externalId: null,
            },
          });
        }
      } else {
        return res.status(400).json({
          error: "invalid body",
          message: "Missing food_id and no externalId/name provided",
        });
      }

      foodId = food.id;
    }

    rows.push({
      mealId: meal.id,
      foodId: foodId,
      quantity: it.qty ?? it.quantity ?? 1,
      unit: it.unit ?? null,
      notes: it.notes ?? null,
      calories: it.calories ?? null,
      protein: it.protein ?? null,
      carbs: it.carbs ?? null,
      fat: it.fat ?? null,
      fiber: it.fiber ?? null,
      sugar: it.sugar ?? null,
      sodium: it.sodium ?? null,
    });
  }

  await prisma.mealItem.createMany({ data: rows });
}

    return res.json(meal);
  } catch (e) {
    console.error("[MEALS] Save failed:", e);
    return res.status(500).json({ error: "failed_to_save_meal", message: e.message });
  }
});

app.get("/meals", auth, async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  const start = date ? new Date(`${date}T00:00:00.000Z`) : new Date("1970-01-01T00:00:00.000Z");
  const end   = date ? new Date(`${date}T23:59:59.999Z`) : new Date("2999-12-31T23:59:59.999Z");
  const meals = await prisma.meal.findMany({
    where: { userId: req.userId, dateTime: { gte: start, lte: end } },
    include: { items: { include: { food: true } } },
    orderBy: { dateTime: "desc" }
  });
  const response = meals.map((meal) => ({
    ...meal,
    occurredAt: meal.dateTime,
    items: meal.items.map((item) => ({
      ...item,
      qty: item.quantity,
      food: toFoodResponse(item.food),
    })),
  }));
  res.json(response);
});

app.delete("/meals/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "invalid meal id" });
    }

    const existing = await prisma.meal.findFirst({
      where: { id: id, userId: req.userId },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "meal not found" });
    }

    await prisma.meal.delete({ where: { id: id } });
    return res.json({ ok: true });
  } catch (e) {
    console.error("[MEALS] Delete failed:", e);
    return res.status(500).json({ error: "failed_to_delete_meal", message: e.message });
  }
});

// --- AI Food Analysis ---
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
model: "gpt-4.1-mini",
input: [
{
role: "user",
content: [
{ type: "input_text", text: promptText },
{ type: "input_image", image_url: dataUrl }
]
}
]
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

//replacing saveFood with a dummy function because the Postgre server didn't get set up, and I can't be bothered to do that today
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
calories: food.calories,
description: Array.isArray(food.ingredients) && food.ingredients.length ? "Ingredients: " + food.ingredients.join(", ") : null,
source: "PHOTO_API"
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

//this function saves the normalized food to the database so we can reuse it later
/*async function saveFood(food)
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
}*/

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
  try {
    // Get user allergies from UserAllergy relation
    const userAllergies = await prisma.userAllergy.findMany({
      where: { userId: req.userId },
      include: { allergy: true }
    });
    
    // For now, return empty arrays - preferences are stored differently in this schema
    // You may need to adjust this based on your actual preference storage
    res.json({ 
      allergies: userAllergies.map(ua => ua.allergy.name) || [], 
      dietaryPreferences: [] 
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/user/preferences", auth, async (req, res) => {
  try {
    const { allergies, dietaryPreferences } = req.body;
    if (!Array.isArray(allergies)) {
      return res.status(400).json({ error: "allergies must be an array" });
    }
    
    // Note: This is a simplified version. You may need to map allergies to Allergy IDs
    // For now, just return what was sent
    const cleanAllergies = allergies.map(a => String(a).trim()).filter(a => a.length > 0);
    
    const allergyIds = [];
    for (const name of cleanAllergies) {
      let allergy = await prisma.allergy.findFirst({
        where: { name: name }
      });
      if (!allergy) {
        allergy = await prisma.allergy.create({
          data: { name: name }
        });
      }
      allergyIds.push(allergy.id);
    }
    
    await prisma.userAllergy.deleteMany({
      where: { userId: req.userId }
    });
    
    if (allergyIds.length) {
      await prisma.userAllergy.createMany({
        data: allergyIds.map((id) => ({
          userId: req.userId,
          allergyId: id
        }))
      });
    }
    
    res.json({ allergies: cleanAllergies, dietaryPreferences: dietaryPreferences || [] });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
  console.log(`Server accessible from network devices`);
});
