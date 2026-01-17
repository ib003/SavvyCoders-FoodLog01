// server/src/routes/auth.routes.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { getUserByEmail, saveUser } from "../authStorage";

const router = Router();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing in .env`);
  return v;
}

const JWT_SECRET = requireEnv("JWT_SECRET");

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password, name are required" });
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "email already registered" });
    }

    // simple password rule (you can tighten later)
    if (password.length < 8) {
      return res.status(400).json({ error: "password must be at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    saveUser(user);

    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "server error" });
  }
});

export default router;