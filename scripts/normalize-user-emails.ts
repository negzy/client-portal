/**
 * One-time: lowercases/trims all User emails. Aborts if two rows would collide.
 *
 *   DATABASE_URL="postgresql://..." npx tsx scripts/normalize-user-emails.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  type Row = { id: string; email: string; norm: string };
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT id, email, LOWER(TRIM(email)) AS norm FROM "User"
  `;
  const byNorm = new Map<string, string[]>();
  for (const r of rows) {
    const list = byNorm.get(r.norm) ?? [];
    list.push(r.id);
    byNorm.set(r.norm, list);
  }
  const conflicts = Array.from(byNorm.entries()).filter(([, ids]) => ids.length > 1);
  if (conflicts.length) {
    console.error(
      "Duplicate logical emails after normalization — fix manually before re-running:",
      conflicts
    );
    process.exit(1);
  }

  const affected = await prisma.$executeRaw`
    UPDATE "User" SET email = LOWER(TRIM(email))
    WHERE email IS DISTINCT FROM LOWER(TRIM(email))
  `;
  console.log("Rows updated:", affected);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
