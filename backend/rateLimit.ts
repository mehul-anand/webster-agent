import type { NextFunction, Request, Response } from "express";
import { prisma } from "./db";
import { evolveCounters, isOverLimit, startOfDay, startOfMinute } from "./rateLimitCore";

const DAILY_LIMIT = Number(process.env.RATE_LIMIT_DAILY) || 50;
const BURST_LIMIT = Number(process.env.RATE_LIMIT_PER_MIN) || 10;

export async function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = new Date();
  const dayWindow = startOfDay(now);
  const burstWindow = startOfMinute(now);

  try {
    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.rateLimit.findUnique({
        where: { userId },
      });

      if (!existing) {
        return tx.rateLimit.create({
          data: {
            userId,
            dailyCount: 1,
            dailyReset: dayWindow,
            burstCount: 1,
            burstReset: burstWindow,
          },
        });
      }

      const next = evolveCounters(existing, dayWindow, burstWindow);

      return tx.rateLimit.update({
        where: { id: existing.id },
        data: next,
      });
    });

    if (isOverLimit(row.dailyCount, row.burstCount, DAILY_LIMIT, BURST_LIMIT)) {
      return res.status(429).json({
        error: "Rate limit reached. Please try again later.",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}
