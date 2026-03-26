import { PrismaClient } from "@prisma/client";
import { sanitizeDatabaseUrlEnv } from "./sanitize-database-url";

sanitizeDatabaseUrlEnv();

/**
 * One PrismaClient per serverless instance (Vercel lambda warm container).
 * Do NOT call $connect() before every query — that burns pooler sessions and triggers
 * Supabase "MaxClientsInSessionMode" when combined with Session pooler or low pool size.
 *
 * Recommended on Vercel: Neon via **Storage** (pooled `DATABASE_URL` + direct
 * `DATABASE_URL_UNPOOLED`). Supabase: transaction pooler (6543) for
 * `DATABASE_URL`, direct 5432 for `DATABASE_URL_UNPOOLED`. See `.env.example` and `docs/DEPLOY.md`.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
