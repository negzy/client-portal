import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  creditMonitoringEmail: z.string().optional().nullable(),
  creditMonitoringUsername: z.string().optional().nullable(),
  creditMonitoringNotes: z.string().optional().nullable(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role === "ADMIN") {
    return NextResponse.json({ error: "Use admin client tools for admin edits" }, { status: 403 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  await prisma.clientProfile.update({
    where: { id: profile.id },
    data: {
      creditMonitoringEmail: body.creditMonitoringEmail ?? undefined,
      creditMonitoringUsername: body.creditMonitoringUsername ?? undefined,
      creditMonitoringNotes: body.creditMonitoringNotes ?? undefined,
    },
  });

  return NextResponse.json({ success: true });
}
