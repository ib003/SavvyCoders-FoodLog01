// server/src/api.ts
import { Router } from "express";
import aiRoutes from "./routes/ai.routes";

const router = Router();

router.get("/ping", (_req, res) => {
  res.json({ ok: true, message: "api works" });
});

router.get("/openai-check", (_req, res) => {
  const hasKey = !!process.env.OPENAI_API_KEY;
  res.json({
    ok: hasKey,
    message: hasKey ? "key loaded" : "missing OPENAI_API_KEY",
  });
});

// Mount AI routes at /api/ai/...
router.use("/ai", aiRoutes);

export default router;