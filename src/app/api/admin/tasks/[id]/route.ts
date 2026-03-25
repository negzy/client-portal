import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { TaskStatus } from "@prisma/client";

const patchSchema = z.object({
  assignedToId: z.string().optional().nullable(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE", "WAITING"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { clientProfile: { select: { userId: true } } },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const data: { assignedToId?: string | null; status?: TaskStatus; completedAt?: Date | null } = {};

  if (body.status !== undefined) {
    data.status = body.status as TaskStatus;
    data.completedAt = body.status === "COMPLETE" ? new Date() : null;
  }

  if (body.assignedToId !== undefined) {
    if (body.assignedToId === null || body.assignedToId === "") {
      data.assignedToId = null;
    } else {
      const assignee = await prisma.user.findUnique({
        where: { id: body.assignedToId },
        select: { id: true, role: true },
      });
      if (!assignee) {
        return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
      }
      if (assignee.role !== "ADMIN" && assignee.id !== task.clientProfile.userId) {
        return NextResponse.json({ error: "Can only assign to this client or an admin" }, { status: 400 });
      }
      data.assignedToId = assignee.id;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  await prisma.task.update({
    where: { id: taskId },
    data,
  });

  return NextResponse.json({ success: true });
}
