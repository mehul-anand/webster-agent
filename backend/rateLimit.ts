import type { NextFunction, Request, Response } from "express";
import { prisma } from "./db";

const DAILY_LIMIT = Number(process.env.RATE_LIMIT_DAILY) || 50;
const BURST_LIMIT = Number(process.env.RATE_LIMIT_PER_MIN) || 10;

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function startOfMinute(d: Date) {
  const copy = new Date(d);
  copy.setUTCSeconds(0, 0);
  return copy;
}

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

      const dayStale = existing.dailyReset < dayWindow;
      const burstStale = existing.burstReset < burstWindow;

      return tx.rateLimit.update({
        where: { id: existing.id },
        data: {
          dailyCount: dayStale ? 1 : existing.dailyCount + 1,
          dailyReset: dayStale ? dayWindow : existing.dailyReset,
          burstCount: burstStale ? 1 : existing.burstCount + 1,
          burstReset: burstStale ? burstWindow : existing.burstReset,
        },
      });
    });

    if (row.dailyCount > DAILY_LIMIT || row.burstCount > BURST_LIMIT) {
      return res.status(429).json({
        error: "Rate limit reached. Please try again later.",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}
