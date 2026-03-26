import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["CLIENT", "ADMIN"]).default("CLIENT"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const email = parsed.email.trim().toLowerCase();
    const { password, name, role } = parsed;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );

    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role as Role,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    if (role === "CLIENT") {
      await prisma.clientProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    console.error("[register]", e);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
