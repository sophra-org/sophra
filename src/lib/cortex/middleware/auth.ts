import logger from "@/lib/shared/logger";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function validateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers.authorization?.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET;

  logger.debug("Environment check", {
    environment: process.env.NODE_ENV,
    hasJwtSecret: !!jwtSecret,
  });

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  if (!jwtSecret) {
    logger.error("JWT_SECRET not configured");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    (req as any).user = decoded;

    logger.debug("Token validated successfully", {
      userId: typeof decoded === "object" ? decoded.sub : "unknown",
    });

    next();
  } catch (error) {
    logger.error("Token validation error", {
      error,
      secretPreview: jwtSecret ? `${jwtSecret.slice(0, 8)}...` : "undefined",
    });
    res.status(401).json({ error: "Invalid token" });
  }
}
