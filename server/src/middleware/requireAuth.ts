// server/src/middleware/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

type AuthedRequest = Request & { user?: JwtPayload };

function getTokenFromHeader(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return null;

  return token.trim();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ error: "Missing token" });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "JWT_SECRET missing on server" });

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded?.sub) return res.status(401).json({ error: "Invalid token payload" });

    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}