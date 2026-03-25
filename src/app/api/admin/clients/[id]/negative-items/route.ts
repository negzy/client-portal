import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Bureau } from "@prisma/client";

const schema = z.object({
  accountName: z.string().min(1),
  bureau: z.enum(["Experian", "Equifax", "TransUnion"]),
  accountType: z.string().optional(),
  balance: z.number().optional(),
  negativeReason: z.string().optional(),
  accountNumber: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: clientProfileId } = await params;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { id: clientProfileId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  await prisma.negativeItem.create({
    data: {
      clientProfileId,
      accountName: body.accountName.trim().slice(0, 255),
      bureau: body.bureau as Bureau,
      accountType: body.accountType?.trim() || undefined,
      balance: body.balance != null && Number.isFinite(body.balance) ? body.balance : undefined,
      negativeReason: body.negativeReason?.trim() || undefined,
      accountNumber: body.accountNumber?.trim() || undefined,
    },
  });

  return NextResponse.json({ success: true });
}
