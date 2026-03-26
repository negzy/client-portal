import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { normalizeUserEmail } from "@/lib/user-email";
import { randomBytes } from "crypto";

const TOKEN_BYTES = 32;
const EXPIRES_HOURS = 1;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = typeof body.email === "string" ? body.email : "";
    const email = raw ? normalizeUserEmail(raw) : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user =
      (await prisma.user.findUnique({ where: { email } })) ??
      (await prisma.user.findFirst({
        where: { email: { equals: raw.trim(), mode: "insensitive" } },
      }));
    if (!user) {
      return NextResponse.json({ message: "If that email is on file, we sent a reset link." });
    }

    const token = randomBytes(TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
    await sendPasswordResetEmail({
      toEmail: user.email,
      resetUrl,
      expiresInMinutes: EXPIRES_HOURS * 60,
    });

    return NextResponse.json({ message: "If that email is on file, we sent a reset link." });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
