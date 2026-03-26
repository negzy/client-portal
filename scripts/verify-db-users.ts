/**
 * Check that DATABASE_URL points at the DB you expect (same users as Supabase Table Editor).
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/verify-db-users.ts
 *   DATABASE_URL="postgresql://..." npx tsx scripts/verify-db-users.ts client@example.com
 */
import { PrismaClient } from "@prisma/client";
import { sanitizeDatabaseUrlEnv } from "../src/lib/sanitize-database-url";
import { normalizeUserEmail } from "../src/lib/user-email";

sanitizeDatabaseUrlEnv();

const prisma = new PrismaClient();

async function main() {
  const emailArg = process.argv[2]?.trim();
  const emailNorm = emailArg ? normalizeUserEmail(emailArg) : "";
  const total = await prisma.user.count();
  console.log("Total User rows in this database:", total);

  if (!emailArg) {
    const sample = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { email: true, role: true, passwordHash: true },
    });
    console.log("Latest 5 users (email, role, has password):");
    for (const u of sample) {
      console.log(
        `  ${u.email} | ${u.role} | password: ${u.passwordHash ? "yes" : "NO — cannot login with password"}`
      );
    }
    return;
  }

  const exact = await prisma.user.findUnique({ where: { email: emailArg } });
  const canonical = emailNorm
    ? await prisma.user.findUnique({ where: { email: emailNorm } })
    : null;
  const ins = await prisma.user.findFirst({
    where: { email: { equals: emailArg, mode: "insensitive" } },
  });

  console.log("Lookup for:", emailArg);
  console.log("  findUnique(exact as typed):", exact ? `found id=${exact.id}` : "no");
  console.log("  findUnique(normalized):", canonical ? `found id=${canonical.id}` : "no");
  console.log("  findFirst(insensitive):", ins ? `found id=${ins.id} storedEmail=${ins.email}` : "no");

  const raw = await prisma.$queryRaw<{ id: string; email: string }[]>`
    SELECT id, email FROM "User"
    WHERE LOWER(TRIM(email)) = ${emailNorm}
    LIMIT 2
  `;
  console.log("  raw SQL LOWER(TRIM) matches:", raw.length ? raw : "none");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
