import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewMessageNotification } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  recipientClientProfileId: z.string(),
  body: z.string().min(1).max(10000),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { id: body.recipientClientProfileId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  // Client can only send to their own profile (admin will be recipient in that case we'd have admin sending to clientProfileId).
  // So: if current user is client, their profile must equal recipientClientProfileId (sending to self = thread with admin).
  const myProfile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  const isAdmin = (session.user as { role?: string }).role === "ADMIN";
  const allowed =
    isAdmin ||
    (myProfile?.id === body.recipientClientProfileId && myProfile?.id === profile.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.message.create({
    data: {
      senderId: session.user.id,
      recipientId: body.recipientClientProfileId,
      clientProfileId: body.recipientClientProfileId,
      body: body.body,
    },
  });

  // When admin sends a message, email the client so they know to check the portal.
  if (isAdmin) {
    const recipientProfile = await prisma.clientProfile.findUnique({
      where: { id: body.recipientClientProfileId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (recipientProfile?.user?.email) {
      const portalUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const preview = body.body.slice(0, 120);
      await sendNewMessageNotification({
        toEmail: recipientProfile.user.email,
        clientName: recipientProfile.user.name ?? "Client",
        messagePreview: preview,
        portalUrl,
      });
    }
  }

  return NextResponse.json({ success: true });
}
