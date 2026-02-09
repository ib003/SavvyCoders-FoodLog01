// src/lib/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthedRequest = Request & { user?: { id: string } };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.get("authorization"); // string | undefined

  if (!authHeader) {
    return res.status(401).json({ error: "Missing token" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET not set" });
    }

    const payload = jwt.verify(token, secret) as any;

    // Support common payload shapes
    const userId = payload?.sub || payload?.userId || payload?.id;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = { id: String(userId) };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}