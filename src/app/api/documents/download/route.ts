import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  const isAdmin = (session.user as { role?: string }).role === "ADMIN";

  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");
  if (!filePath) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  // Blob URL (Vercel Blob or other): redirect to the URL
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return NextResponse.redirect(filePath, 302);
  }

  const resolved = path.resolve(process.cwd(), filePath);
  const cwd = process.cwd();
  if (!resolved.startsWith(cwd) || resolved.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const relativePath = path.relative(cwd, resolved);
  if (!isAdmin) {
    if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const allowedPrefixes = [
      `uploads${path.sep}vault${path.sep}${profile.id}`,
      `uploads${path.sep}audits`,
      `uploads${path.sep}credit${path.sep}${profile.id}`,
    ];
    const allowed = allowedPrefixes.some(
      (prefix) => relativePath === prefix || relativePath.startsWith(prefix + path.sep)
    );
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else {
    if (!relativePath.startsWith("uploads" + path.sep)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 404 });
    }
    const buffer = await fs.readFile(resolved);
    const name = path.basename(resolved);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
