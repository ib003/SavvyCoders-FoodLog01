// server/src/routes/ai.routes.ts
import { Router } from "express";
import { analyzeSymptoms, chatWithAI } from "../services/openai.service";

const router = Router();

/**
 * POST /api/ai/chat
 * Body: { message: string }
 * Returns: { reply: string }
 */
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body as { message?: string };

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    // Simple cost/abuse guard
    if (message.length > 2000) {
      return res
        .status(400)
        .json({ error: "message too long (max 2000 chars)" });
    }

    const reply = await chatWithAI(message);
    return res.json({ reply });
  } catch (err: any) {
    console.error("AI chat error:", err?.message ?? err);
    return res.status(500).json({
      error: "AI request failed",
      details: err?.message ?? "unknown error",
    });
  }
});

/**
 * POST /api/ai/symptoms
 * Body:
 * {
 *   foods: string[],
 *   symptoms: string[],
 *   allergies?: string[],
 *   notes?: string
 * }
 *
 * Returns JSON:
 * {
 *   likely_triggers: [{ trigger, reason, confidence }],
 *   quick_actions_today: string[],
 *   what_to_log_next_time: string[],
 *   red_flags_seek_care_if: string[],
 *   disclaimer: string
 * }
 */
router.post("/symptoms", async (req, res) => {
  try {
    const { foods, symptoms, allergies, notes } = req.body as {
      foods?: string[];
      symptoms?: string[];
      allergies?: string[];
      notes?: string;
    };

    if (!Array.isArray(foods) || foods.length === 0) {
      return res
        .status(400)
        .json({ error: "foods must be a non-empty array of strings" });
    }
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res
        .status(400)
        .json({ error: "symptoms must be a non-empty array of strings" });
    }

    // Cost/abuse guards (keeps requests small and predictable)
    if (foods.length > 30) {
      return res.status(400).json({ error: "too many foods (max 30)" });
    }
    if (symptoms.length > 20) {
      return res.status(400).json({ error: "too many symptoms (max 20)" });
    }
    if (Array.isArray(allergies) && allergies.length > 30) {
      return res.status(400).json({ error: "too many allergies (max 30)" });
    }
    if (typeof notes === "string" && notes.length > 500) {
      return res.status(400).json({ error: "notes too long (max 500 chars)" });
    }

    const result = await analyzeSymptoms({
      foods: foods.map((x) => String(x).trim()).filter(Boolean),
      symptoms: symptoms.map((x) => String(x).trim()).filter(Boolean),
      allergies: Array.isArray(allergies)
        ? allergies.map((x) => String(x).trim()).filter(Boolean)
        : undefined,
      notes: typeof notes === "string" ? notes.trim() : undefined,
    });

    return res.json(result);
  } catch (err: any) {
    console.error("Symptoms AI error:", err?.message ?? err);
    return res.status(500).json({
      error: "AI request failed",
      details: err?.message ?? "unknown error",
    });
  }
});

export default router;