import type { NextFunction, Request, Response } from "express";

import { createSupabaseClient } from "./client";
import { prisma } from "./db";

const client = createSupabaseClient();

export async function middleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  const data = await client.auth.getUser(token);

  const userId = data.data.user?.id;

  if (userId) {
    await prisma.user.upsert({
      where: { supabaseId: userId },
      create: {
        supabaseId: userId,
        email: data.data.user?.email!,
        provider:
          data.data.user?.app_metadata.provider === "google"
            ? "Google"
            : "Github",
        name:
          data.data.user?.user_metadata.full_name ??
          data.data.user?.user_metadata.name ??
          "Unknown",
      },
      update: {},
    });
    req.userId = userId;

    next();
  } else {
    res.status(403).json({
      message: "Incorrect inputs",
    });
  }
}
