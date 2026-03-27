import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  adminNotesCfpb: z.string().optional().nullable(),
  adminNotesCreditMonitoring: z.string().optional().nullable(),
  adminNotesEmail: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
});

export async function PATCH(
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

  await prisma.clientProfile.update({
    where: { id: clientProfileId },
    data: {
      adminNotesCfpb: body.adminNotesCfpb ?? undefined,
      adminNotesCreditMonitoring: body.adminNotesCreditMonitoring ?? undefined,
      adminNotesEmail: body.adminNotesEmail ?? undefined,
      internalNotes: body.internalNotes ?? undefined,
    },
  });

  return NextResponse.json({ success: true });
}
