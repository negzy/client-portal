import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_KEYS = [
  { key: "CFPB", label: "CFPB details" },
  { key: "FTC", label: "FTC details" },
  { key: "GENERAL", label: "General credentials / notes" },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notes = await prisma.adminNote.findMany({ orderBy: { key: "asc" } });
  const byKey = new Map(notes.map((n) => [n.key, n]));
  const result = DEFAULT_KEYS.map(({ key, label }) => ({
    key,
    label,
    content: byKey.get(key)?.content ?? "",
    updatedAt: byKey.get(key)?.updatedAt?.toISOString() ?? null,
  }));
  return NextResponse.json(result);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { key, label, content } = body as { key?: string; label?: string; content?: string };
  if (!key?.trim()) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  const note = await prisma.adminNote.upsert({
    where: { key: key.trim() },
    create: {
      key: key.trim(),
      label: (label ?? key).trim(),
      content: typeof content === "string" ? content : "",
    },
    update: {
      ...(label != null && { label: String(label).trim() }),
      ...(content != null && { content: String(content) }),
    },
  });
  return NextResponse.json(note);
}
