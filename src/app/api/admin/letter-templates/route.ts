import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const title = formData.get("title") as string | null;
  const category = formData.get("category") as string | null;
  const description = (formData.get("description") as string) || null;
  const file = formData.get("file") as File | null;

  if (!title?.trim() || !file?.size) {
    return NextResponse.json({ error: "Title and file are required" }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".pdf";
  const dir = path.join(process.cwd(), "uploads", "letter-templates");
  await mkdir(dir, { recursive: true });
  const fileName = `${randomUUID()}${ext}`;
  const filePath = path.join(dir, fileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const relativePath = path.relative(process.cwd(), filePath);

  await prisma.letterTemplate.create({
    data: {
      title: title.trim(),
      category: category ?? "custom",
      description: description?.trim() || null,
      filePath: relativePath,
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.letterTemplate.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
