import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { DocumentCategory } from "@prisma/client";

export async function POST(req: Request) {
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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as DocumentCategory) || "OTHER";

  if (!file?.size) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  const dir = path.join(process.cwd(), "uploads", "vault", profile.id);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const fileName = `${randomUUID()}${ext}`;
  const filePath = path.join(dir, fileName);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  await prisma.document.create({
    data: {
      clientProfileId: profile.id,
      category,
      fileName: file.name,
      filePath: path.relative(process.cwd(), filePath),
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  return NextResponse.json({ success: true });
}
