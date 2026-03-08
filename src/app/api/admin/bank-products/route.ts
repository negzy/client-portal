import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Bureau } from "@prisma/client";

const schema = z.object({
  bankName: z.string().min(1),
  productName: z.string().min(1),
  bureauPull: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  typicalScoreMin: z.number().nullable().optional(),
  typicalScoreMax: z.number().nullable().optional(),
  relationshipBanking: z.boolean().default(false),
  status: z.string().nullable().optional(),
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

  await prisma.bankProduct.create({
    data: {
      bankName: body.bankName,
      productName: body.productName,
      bureauPull: (body.bureauPull as Bureau) ?? undefined,
      notes: body.notes ?? undefined,
      typicalScoreMin: body.typicalScoreMin ?? undefined,
      typicalScoreMax: body.typicalScoreMax ?? undefined,
      relationshipBanking: body.relationshipBanking,
      status: body.status ?? undefined,
    },
  });

  return NextResponse.json({ success: true });
}
