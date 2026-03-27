import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { analyzeCreditReport } from "@/lib/credit-audit";
import { generateAuditPdfBuffer } from "@/lib/audit-pdf";
import { isBlobStorageAvailable, uploadToBlob } from "@/lib/blob";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lead = await prisma.contact.findUnique({
    where: { id: params.id },
    select: { id: true, fullName: true, email: true, clientProfileId: true },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.clientProfileId) {
    return NextResponse.json(
      { error: "Lead is already converted to a client profile." },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file?.size) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const nameLower = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  if (!mime.includes("pdf") && !nameLower.endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF credit reports are accepted." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const reportBuffer = Buffer.from(bytes);

  let rawText = "";
  try {
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(reportBuffer));
    const { text } = await extractText(pdf, { mergePages: true });
    rawText = typeof text === "string" ? text.trim() : "";
  } catch (e) {
    console.error("[lead-audit] PDF text extraction failed:", e);
  }

  const analysis = analyzeCreditReport({
    fileName: file.name,
    type: "pdf",
    clientName: lead.fullName,
    rawText: rawText || undefined,
  });

  const pdfBuffer = await generateAuditPdfBuffer({
    clientName: lead.fullName,
    auditDate: new Date(),
    scoreSnapshot: analysis.scoreSnapshot,
    negativeCount: analysis.negativeItems.length,
    collectionsCount: analysis.collectionsCount,
    chargeOffsCount: analysis.chargeOffsCount,
    hardInquiriesCount: analysis.hardInquiriesCount,
    hardInquiriesPerBureau: analysis.hardInquiriesPerBureau,
    utilizationPct: analysis.utilizationPct,
    totalRevolvingBalance: analysis.totalRevolvingBalance,
    totalRevolvingLimit: analysis.totalRevolvingLimit,
    reportSummary: analysis.reportSummary,
    summaryIssues: analysis.summaryIssues,
    recommendedSteps: analysis.recommendedSteps,
    capitalReadinessNotes: analysis.capitalReadinessNotes,
    negativeItems: analysis.negativeItems.map((it) => ({
      accountName: it.accountName,
      bureau: it.bureau,
      accountType: it.accountType ?? null,
      balance: it.balance ?? null,
      negativeReason: it.negativeReason ?? null,
    })),
    factorsAffecting: analysis.factorsAffecting,
    latePaymentMatrix: analysis.latePaymentMatrix,
  });

  const safeLead = (lead.fullName || "lead")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "lead";
  const filename = `lead-credit-audit-${safeLead}.pdf`;
  let pdfUrl: string | null = null;

  if (isBlobStorageAvailable()) {
    pdfUrl = await uploadToBlob(pdfBuffer, `lead-audits/${lead.id}/${filename}`, {
      contentType: "application/pdf",
    });
  } else {
    const dir = path.join(process.cwd(), "uploads", "lead-audits", lead.id);
    await mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, `${randomUUID()}-${filename}`);
    await writeFile(fullPath, pdfBuffer);
    pdfUrl = path.relative(process.cwd(), fullPath);
  }

  return NextResponse.json({
    success: true,
    lead: { id: lead.id, fullName: lead.fullName, email: lead.email },
    pdfUrl,
    summary: {
      scoreSnapshot: analysis.scoreSnapshot,
      negativeCount: analysis.negativeItems.length,
      collectionsCount: analysis.collectionsCount,
      chargeOffsCount: analysis.chargeOffsCount,
      hardInquiriesCount: analysis.hardInquiriesCount,
      hardInquiriesPerBureau: analysis.hardInquiriesPerBureau,
      utilizationPct: analysis.utilizationPct,
      summaryIssues: analysis.summaryIssues,
      recommendedSteps: analysis.recommendedSteps,
    },
  });
}

