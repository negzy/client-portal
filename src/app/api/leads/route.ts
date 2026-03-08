import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  state: z.string().optional(),
  businessName: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  affiliateCode: z.string().optional(),
});

/** POST: Public lead capture (no auth). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const existing = await prisma.contact.findFirst({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json(
        { success: true, message: "We already have your info. We'll be in touch." },
        { status: 200 }
      );
    }

    let affiliateId: string | null = null;
    if (data.affiliateCode) {
      const aff = await prisma.affiliate.findUnique({
        where: { code: data.affiliateCode },
      });
      if (aff) affiliateId = aff.id;
    }

    const contact = await prisma.contact.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        state: data.state ?? null,
        businessName: data.businessName ?? null,
        notes: data.notes ?? null,
        status: "lead",
        source: data.source ?? "web",
        affiliateId: affiliateId,
      },
    });
    if (affiliateId) {
      await prisma.referral.create({
        data: { affiliateId, contactId: contact.id, status: "pending" },
      });
    }

    return NextResponse.json({ success: true, message: "Thanks! We'll be in touch." });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}

/** GET: Admin list leads (auth required). */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const contacts = await prisma.contact.findMany({
    where: {
      clientProfileId: null,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      assignedAdmin: { select: { name: true, email: true } },
      affiliate: { select: { name: true, code: true } },
    },
  });

  return NextResponse.json({ leads: contacts });
}
