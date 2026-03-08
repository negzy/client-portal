import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Bureau, DisputeRoundType } from "@prisma/client";

const schema = z.object({
  clientProfileId: z.string(),
  roundType: z.enum([
    "ROUND_1_BUREAU",
    "ROUND_2_MOV",
    "ROUND_3_CREDITOR",
    "ROUND_4_CFPB",
  ]),
  roundNumber: z.number().int().min(1),
  bureau: z.enum(["Experian", "Equifax", "TransUnion"]).optional(),
  negativeItemIds: z.array(z.string()).default([]),
  dateSent: z.string().optional(),
  deliveryStatus: z.string().optional(),
  outcome: z.string().optional(),
  nextStep: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { id: body.clientProfileId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const round = await prisma.disputeRound.create({
    data: {
      clientProfileId: body.clientProfileId,
      roundType: body.roundType as DisputeRoundType,
      roundNumber: body.roundNumber,
      bureau: (body.bureau as Bureau) ?? undefined,
      dateSent: body.dateSent ? new Date(body.dateSent) : undefined,
      deliveryStatus: body.deliveryStatus ?? undefined,
      outcome: body.outcome ?? undefined,
      nextStep: body.nextStep ?? undefined,
    },
  });

  if (body.negativeItemIds.length) {
    await prisma.disputeRoundItem.createMany({
      data: body.negativeItemIds.map((negativeItemId) => ({
        disputeRoundId: round.id,
        negativeItemId,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ success: true, roundId: round.id });
}
