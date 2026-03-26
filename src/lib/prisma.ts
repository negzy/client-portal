import { PrismaClient } from "@prisma/client";
import { sanitizeDatabaseUrlEnv } from "./sanitize-database-url";

sanitizeDatabaseUrlEnv();

/**
 * One PrismaClient per serverless instance (Vercel lambda warm container).
 * Do NOT call $connect() before every query — that burns pooler sessions and triggers
 * Supabase "MaxClientsInSessionMode" when combined with Session pooler or low pool size.
 *
 * Vercel production DATABASE_URL must use a **transaction** pooler (e.g. Supabase port 6543)
 * with `?pgbouncer=true` (not Session mode on 5432). See `.env.example`.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
