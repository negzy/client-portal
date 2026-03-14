import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { analyzeCreditReport, createAuditFromAnalysis } from "@/lib/credit-audit";
import type { Bureau } from "@prisma/client";
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
  const type = (formData.get("type") as string) || "pdf";
  const experianScoreRaw = formData.get("experianScore") as string | null;
  const equifaxScoreRaw = formData.get("equifaxScore") as string | null;
  const transUnionScoreRaw = formData.get("transUnionScore") as string | null;

  const parseScore = (raw: string | null): number | undefined => {
    if (raw == null || String(raw).trim() === "") return undefined;
    const n = parseInt(String(raw).trim(), 10);
    if (Number.isNaN(n) || n < 300 || n > 850) return undefined;
    return n;
  };
  const scoreOverrides = (() => {
    const ex = parseScore(experianScoreRaw);
    const eq = parseScore(equifaxScoreRaw);
    const tu = parseScore(transUnionScoreRaw);
    if (ex == null && eq == null && tu == null) return undefined;
    return { experian: ex, equifax: eq, transUnion: tu };
  })();

  if (!file?.size) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || (type === "pdf" ? ".pdf" : ".jpg");
  const baseName = `${randomUUID()}${ext}`;
  let filePath: string;

  if (isBlobStorageAvailable()) {
    const blobUrl = await uploadToBlob(
      buffer,
      `credit/${profile.id}/${baseName}`,
      { contentType: file.type || (type === "pdf" ? "application/pdf" : "image/jpeg") }
    );
    if (!blobUrl) {
      return NextResponse.json(
        { error: "Upload failed. Please try again." },
        { status: 503 }
      );
    }
    filePath = blobUrl;
  } else {
    const dir = path.join(process.cwd(), "uploads", "credit", profile.id);
    try {
      await mkdir(dir, { recursive: true });
      const fullPath = path.join(dir, baseName);
      await writeFile(fullPath, buffer);
      filePath = path.relative(process.cwd(), fullPath);
    } catch (err) {
      console.error("[credit/upload] write failed:", err);
      return NextResponse.json(
        { error: "File storage is not available on this server. Uploads are disabled. Please contact support or try again later." },
        { status: 503 }
      );
    }
  }

  // Extract text from PDF for score and negative-item parsing
  let rawText: string | undefined;
  if ((type === "pdf" || file.type === "application/pdf") && buffer.length > 0) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      rawText = (result && typeof result === "object" && "text" in result)
        ? String((result as { text?: string }).text ?? "")
        : "";
      if (!rawText?.trim() && result && typeof result === "object" && "pages" in result) {
        const pages = (result as { pages?: Array<{ text?: string }> }).pages;
        if (Array.isArray(pages)) {
          rawText = pages.map((p) => (p && typeof p === "object" && "text" in p ? String(p.text ?? "") : "")).join("\n");
        }
      }
      rawText = rawText?.trim() || undefined;
    } catch (e) {
      console.error("PDF text extraction failed:", e);
    }
  }

  // Store document in vault
  await prisma.document.create({
    data: {
      clientProfileId: profile.id,
      category: "CREDIT_REPORT",
      fileName: file.name,
      filePath: path.relative(process.cwd(), filePath),
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  const analysis = analyzeCreditReport({
    fileName: file.name,
    type,
    clientName: session.user?.name ?? "Client",
    scoreOverrides,
    rawText: rawText?.trim() || undefined,
  });

  const negativeItems = analysis.negativeItems.map((item) => ({
    ...item,
    bureau: item.bureau as Bureau,
  }));

  for (const item of negativeItems) {
    await prisma.negativeItem.create({
      data: {
        clientProfileId: profile.id,
        accountName: item.accountName,
        bureau: item.bureau,
        accountType: item.accountType ?? undefined,
        balance: item.balance,
        negativeReason: item.negativeReason ?? undefined,
        dateImported: new Date(),
      },
    });
  }

  const audit = await createAuditFromAnalysis(profile.id, session.user?.name ?? "Client", analysis, filePath);

  // Timeline
  await prisma.timelineActivity.createMany({
    data: [
      {
        clientProfileId: profile.id,
        activityType: "REPORT_IMPORTED",
        title: "Credit report uploaded",
        description: `Uploaded ${file.name}`,
        metadata: { fileName: file.name, auditId: audit.id },
      },
      {
        clientProfileId: profile.id,
        activityType: "AUDIT_GENERATED",
        title: "Credit audit generated",
        description: `Audit with ${analysis.negativeItems.length} negative items`,
        metadata: { auditId: audit.id },
      },
      ...(analysis.negativeItems.length
        ? [
            {
              clientProfileId: profile.id,
              activityType: "NEGATIVE_ITEMS_FOUND" as const,
              title: "Negative items identified",
              description: `${analysis.negativeItems.length} items found`,
              metadata: { count: analysis.negativeItems.length },
            },
          ]
        : []),
    ],
  });

  const noDataDetected =
    !scoreOverrides &&
    !analysis.scoreSnapshot &&
    analysis.negativeItems.length === 0;

  return NextResponse.json({
    success: true,
    auditId: audit.id,
    negativeCount: analysis.negativeItems.length,
    noDataDetected: noDataDetected || undefined,
  });
}
