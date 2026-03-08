import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> };

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  // In production (Vercel serverless), the pooler may close connections between warm requests.
  // Reconnecting before each query avoids "Error { kind: Closed }".
  if (process.env.NODE_ENV === "production") {
    return base.$extends({
      name: "reconnect",
      query: {
        $allOperations({ operation, args, query }) {
          return Promise.resolve(base.$connect())
            .catch(() => {})
            .then(() => query(args));
        },
      },
    }) as unknown as PrismaClient;
  }

  return base;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
