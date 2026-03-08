import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  code: z.string().min(1).max(32),
  commissionRate: z.number().min(0).max(100).optional(),
});

/** POST: Create affiliate (admin). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const existing = await prisma.affiliate.findFirst({
      where: { OR: [{ email: data.email }, { code: data.code }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An affiliate with this email or code already exists" },
        { status: 400 }
      );
    }
    const affiliate = await prisma.affiliate.create({
      data: {
        name: data.name,
        email: data.email,
        code: data.code.replace(/\s/g, "").toUpperCase(),
        commissionRate: data.commissionRate ?? null,
      },
    });
    return NextResponse.json(affiliate);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create affiliate" }, { status: 500 });
  }
}
