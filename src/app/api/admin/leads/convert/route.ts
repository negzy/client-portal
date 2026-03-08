import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";

const schema = z.object({
  contactId: z.string(),
  password: z.string().min(8),
});

/** Convert lead (Contact) to client: create User + ClientProfile, link Contact. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { contactId, password } = schema.parse(body);

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });
    if (!contact) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (contact.clientProfileId) {
      return NextResponse.json({ error: "Lead already converted" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: contact.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: contact.email,
        passwordHash,
        name: contact.fullName,
        role: "CLIENT" as Role,
      },
    });

    const profile = await prisma.clientProfile.create({
      data: {
        userId: user.id,
        firstName: contact.fullName.split(" ")[0] ?? contact.fullName,
        lastName: contact.fullName.split(" ").slice(1).join(" ") || null,
        phone: contact.phone,
        state: contact.state,
        businessName: contact.businessName,
        assignedAdminId: session.user.id,
        processStage: "onboarding",
      },
    });

    await prisma.contact.update({
      where: { id: contactId },
      data: {
        clientProfileId: profile.id,
        status: "converted",
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      clientProfileId: profile.id,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}
