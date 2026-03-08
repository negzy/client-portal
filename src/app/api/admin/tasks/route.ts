import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { TaskCategory, TaskStatus } from "@prisma/client";

const schema = z.object({
  clientProfileId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE", "WAITING"]).default("NOT_STARTED"),
  category: z.enum(["Credit", "Funding", "Docs", "BankSetup", "Applications", "Internal"]).default("Credit"),
  dueDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  notes: z.string().optional(),
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

  const dueDate = body.dueDate
    ? new Date(body.dueDate)
    : undefined;

  await prisma.task.create({
    data: {
      clientProfileId: body.clientProfileId,
      title: body.title,
      description: body.description ?? undefined,
      status: (body.status as TaskStatus) ?? "NOT_STARTED",
      category: (body.category as TaskCategory) ?? "Credit",
      dueDate,
      notes: body.notes ?? undefined,
      assignedById: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
