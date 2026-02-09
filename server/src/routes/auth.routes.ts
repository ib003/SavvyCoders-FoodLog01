import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing in .env`);
  return v;
}

const JWT_SECRET = requireEnv("JWT_SECRET");

// ✅ Makes TS happy (and supports "7d" or "3600")
function getExpiresIn(): SignOptions["expiresIn"] {
  const raw = (process.env.JWT_EXPIRES_IN ?? "7d").trim();

  // if someone sets JWT_EXPIRES_IN=3600
  if (/^\d+$/.test(raw)) return Number(raw);

  // otherwise "7d", "1h", "30m", etc.
  return raw as SignOptions["expiresIn"];
}

function signToken(user: { id: string; email: string; name?: string | null }) {
  const options: SignOptions = { expiresIn: getExpiresIn() };

  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name ?? undefined },
    JWT_SECRET,
    options
  );
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password, and name are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "password must be at least 8 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true },
    });

    const token = signToken(user);

    return res.json({ token, user });
  } catch (e: any) {
    console.error("REGISTER ERROR:", e);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e: any) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ error: "Failed to login" });
  }
});

export default router;