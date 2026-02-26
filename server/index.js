require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const jwksClient = require("jwks-rsa");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const OpenAI = require("openai");

let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log("OpenAI initialized.");
} else {
  console.warn("OPENAI_API_KEY not set. AI features disabled.");
}


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
  const q = req.query.q || "";
  const foods = await prisma.food.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    take: 25,
  });
  res.json(foods);
});

app.get("/barcode/:upc", async (req, res) => {
  try {
    const upc = req.params.upc;

    // Try to find an existing Food by its barcode
    let food = await prisma.food.findUnique({ where: { barcode: upc } });
    if (food) {
      return res.json(food);
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

    return res.json(created);
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
  const { occurred_at, meal_type, items } = req.body;
  if (!occurred_at || !meal_type || !Array.isArray(items)) {
    return res.status(400).json({ error: "invalid body" });
  }
  const meal = await prisma.meal.create({
    data: { userId: req.userId, occurredAt: new Date(occurred_at), mealType: meal_type },
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
    where: { userId: req.userId, occurredAt: { gte: start, lte: end } },
    include: { items: { include: { food: true } } },
    orderBy: { occurredAt: "desc" }
  });
  res.json(meals);
});

// --- AI Food Analysis ---
// --- AI Food Analysis ---
app.post("/api/analyze-food", async (req, res) => {
  const image = req.body.image;

  if (!image) {
    return res.status(400).json({ error: "missing image" });
  }

  if (!openai) {
    return res.status(503).json({ error: "AI service not configured" });
  }

  // Make sure it is a data URL
  let dataUrl = image;
  if (!dataUrl.startsWith("data:")) {
    dataUrl = "data:image/jpeg;base64," + dataUrl;
  }

  // Default fallback
  let result = {
    name: "unknown food",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ingredients: [],
  };

  // Helper: pull all text out of Responses API output
  function getResponseText(aiRes) {
    if (!aiRes) return "";
    if (typeof aiRes.output_text === "string") return aiRes.output_text; // sometimes available
    const out = aiRes.output || [];
    let text = "";
    for (const item of out) {
      const content = item?.content || [];
      for (const c of content) {
        if (c?.type === "output_text" && typeof c?.text === "string") {
          text += c.text;
        }
      }
    }
    return text.trim();
  }

  // Normalize to usable numbers/arrays
  function normalizeFood(raw) {
    if (!raw || typeof raw !== "object") return null;

    const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "unknown food";

    let calories = Number(raw.calories);
    if (!Number.isFinite(calories) || calories < 0) calories = 0;

    let protein = Number(raw.protein);
    if (!Number.isFinite(protein) || protein < 0) protein = 0;

    let carbs = Number(raw.carbs);
    if (!Number.isFinite(carbs) || carbs < 0) carbs = 0;

    let fat = Number(raw.fat);
    if (!Number.isFinite(fat) || fat < 0) fat = 0;

    let ingredients = [];
    if (Array.isArray(raw.ingredients)) {
      ingredients = raw.ingredients
        .map((x) => (typeof x === "string" ? x.trim() : String(x).trim()))
        .filter(Boolean)
        .slice(0, 25);
    }

    return { name, calories, protein, carbs, fat, ingredients };
  }

  // Optional: saveFood (currently disabled in your code)
  async function saveFood(food) {
    return null;
  }

  try {
    const aiRes = await openai.responses.create({
      model: "gpt-4.1-mini",
      // ✅ Force STRICT JSON output using a schema
      text: {
        format: {
          type: "json_schema",
          name: "food_estimate",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              calories: { type: "number" },
              protein: { type: "number" },
              carbs: { type: "number" },
              fat: { type: "number" },
              ingredients: { type: "array", items: { type: "string" } },
            },
            required: ["name", "calories", "protein", "carbs", "fat", "ingredients"],
          },
        },
      },
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Look at the image. Identify the food as best you can and estimate nutrition. " +
                "Return only the JSON object that matches the schema.",
            },
            { type: "input_image", image_url: dataUrl },
          ],
        },
      ],
    });

    const aiText = getResponseText(aiRes);

    // With json_schema strict, this should already be JSON text
    // But still parse defensively.
    let parsed = null;
    try {
      parsed = JSON.parse(aiText);
    } catch (e) {
      console.error("AI returned non-JSON text:", aiText);
      throw new Error("AI did not return valid JSON");
    }

    const clean = normalizeFood(parsed);
    if (!clean) {
      return res.status(500).json({ error: "ai result invalid" });
    }

    // Save (optional)
    const saved = await saveFood(clean);

    return res.json(saved || clean);
  } catch (err) {
    console.error("ai error", err);

    // return fallback so UI doesn’t break, but include error message for debugging
    return res.status(500).json({
      ...result,
      error: "ai failed to analyze image",
    });
  }
});

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
    res.json({ allergies, dietaryPreferences: dietaryPreferences || [] });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
  console.log(`Server accessible from network devices`);
});
