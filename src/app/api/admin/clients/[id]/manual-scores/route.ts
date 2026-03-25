import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Bureau } from "@prisma/client";

const schema = z.object({
  experian: z.number().int().min(300).max(850).optional(),
  equifax: z.number().int().min(300).max(850).optional(),
  transUnion: z.number().int().min(300).max(850).optional(),
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

  const pairs: { bureau: Bureau; score: number }[] = [];
  if (body.experian != null) pairs.push({ bureau: "Experian", score: body.experian });
  if (body.equifax != null) pairs.push({ bureau: "Equifax", score: body.equifax });
  if (body.transUnion != null) pairs.push({ bureau: "TransUnion", score: body.transUnion });

  if (pairs.length === 0) {
    return NextResponse.json({ error: "Provide at least one bureau score" }, { status: 400 });
  }

  for (const { bureau, score } of pairs) {
    const prev = await prisma.scoreHistory.findFirst({
      where: { clientProfileId, bureau },
      orderBy: { recordedAt: "desc" },
    });
    await prisma.scoreHistory.create({
      data: {
        clientProfileId,
        bureau,
        score,
        previousScore: prev?.score ?? null,
        source: "manual",
      },
    });
  }

  return NextResponse.json({ success: true });
}
