import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { TaskStatus } from "@prisma/client";

const schema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE", "WAITING"]),
});

/** PATCH: Client updates their own task status (e.g. mark in progress or complete). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
  }

  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: { id, clientProfileId: profile.id },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await prisma.task.update({
    where: { id },
    data: {
      status: body.status as TaskStatus,
      ...(body.status === "COMPLETE" ? { completedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
