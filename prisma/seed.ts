import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { sanitizeDatabaseUrlEnv } from "../src/lib/sanitize-database-url";

sanitizeDatabaseUrlEnv();

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await hash("admin123", 12);
  const clientPassword = await hash("client123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@creditlyft.local" },
    update: {},
    create: {
      email: "admin@creditlyft.local",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "client@creditlyft.local" },
    update: {},
    create: {
      email: "client@creditlyft.local",
      name: "Demo Client",
      passwordHash: clientPassword,
      role: "CLIENT",
    },
  });

  const existingProfile = await prisma.clientProfile.findUnique({
    where: { userId: clientUser.id },
  });
  if (!existingProfile) {
    await prisma.clientProfile.create({
      data: {
        userId: clientUser.id,
        status: "active",
      },
    });
  }

  await prisma.script.upsert({
    where: { slug: "bank-call-script" },
    update: {},
    create: {
      title: "Bank call script",
      slug: "bank-call-script",
      category: "bank_call",
      content: `When calling a bank for reconsideration or application status:

1. Identify yourself and state the purpose of the call.
2. Have your application reference number ready if applicable.
3. Be polite and professional.
4. Take notes on the representative's name and any reference numbers.
5. If denied, ask for the specific reason and whether reconsideration is possible.
6. Request a formal letter explaining the decision if applicable.`,
    },
  });

  await prisma.script.upsert({
    where: { slug: "reconsideration-script" },
    update: {},
    create: {
      title: "Reconsideration script",
      slug: "reconsideration-script",
      category: "reconsideration",
      content: `When requesting reconsideration:

1. Reference your application and the date you applied.
2. Briefly explain any positive changes since the application (e.g., reduced utilization, new positive accounts).
3. Ask if they can review your file again with updated information.
4. Be prepared to provide additional documentation if requested.
5. Thank them for their time and ask for a timeline for a decision.`,
    },
  });

  const portalCount = await prisma.portalSettings.count();
  if (portalCount === 0) {
    await prisma.portalSettings.create({
      data: {
        siteName: "CreditLyft",
        primaryColor: "#f97316",
      },
    });
  }

  console.log("Seed complete.");
  console.log("Admin: admin@creditlyft.local / admin123");
  console.log("Client: client@creditlyft.local / client123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
