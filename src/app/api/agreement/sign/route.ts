import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ clientProfileId: z.string() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await req.json());
  const profile = await prisma.clientProfile.findFirst({
    where: { id: body.clientProfileId, userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.clientProfile.update({
    where: { id: profile.id },
    data: { agreementSignedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
