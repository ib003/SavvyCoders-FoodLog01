import "dotenv/config";
import express from "express";
import cors from "cors";

import preferencesRoutes from "./routes/preferences.routes";
import authRoutes from "./routes/auth.routes";
import aiRoutes from "./routes/ai.routes";

import foodsRoutes from "./api/foods.routes";
import mealsRoutes from "./api/meals.routes";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/ai", aiRoutes);

app.use("/api/user", preferencesRoutes); // IMPORTANT: mount on /api/user
app.use("/api/foods", foodsRoutes);
app.use("/api/meals", mealsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});