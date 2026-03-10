import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { DocumentCategory } from "@prisma/client";
import { isBlobStorageAvailable, uploadToBlob } from "@/lib/blob";

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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || "";
  const baseName = `${randomUUID()}${ext}`;

  let filePath: string;

  if (isBlobStorageAvailable()) {
    const blobUrl = await uploadToBlob(
      buffer,
      `vault/${profile.id}/${baseName}`,
      { contentType: file.type || undefined }
    );
    if (blobUrl) {
      filePath = blobUrl;
    } else {
      return NextResponse.json(
        { error: "Upload failed. Please try again." },
        { status: 503 }
      );
    }
  } else {
    const dir = path.join(process.cwd(), "uploads", "vault", profile.id);
    try {
      await mkdir(dir, { recursive: true });
      filePath = path.join(dir, baseName);
      await writeFile(filePath, buffer);
      filePath = path.relative(process.cwd(), filePath);
    } catch (err) {
      console.error("[documents/upload] write failed:", err);
      return NextResponse.json(
        { error: "File storage is not available on this server. Uploads are disabled. Please contact support or try again later." },
        { status: 503 }
      );
    }
  }

  await prisma.document.create({
    data: {
      clientProfileId: profile.id,
      category,
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  return NextResponse.json({ success: true });
}
