import { prisma } from "./prisma";
import type { Bureau } from "@prisma/client";
import { generateAuditPdf } from "./audit-pdf";

export type NegativeItemInput = {
  accountName: string;
  bureau: Bureau;
  accountType?: string | null;
  balance?: number | null;
  accountNumber?: string | null;
  isOpen?: boolean | null;
  negativeReason?: string | null;
};

export type CreditAnalysis = {
  clientName: string;
  scoreSnapshot: string | null;
  negativeItems: NegativeItemInput[];
  collectionsCount: number;
  chargeOffsCount: number;
  latePaymentsCount: number;
  repossessionsCount: number;
  bankruptciesCount: number;
  hardInquiriesCount: number;
  utilizationPct: number | null;
  openAccountsCount: number;
  positiveTradelinesCount: number;
  summaryIssues: string;
  recommendedSteps: string;
  fundingReadinessScore: number;
  capitalReadinessNotes: string;
};

const SCORE_MIN = 300;
const SCORE_MAX = 850;

function isValidScore(n: number): boolean {
  return Number.isInteger(n) && n >= SCORE_MIN && n <= SCORE_MAX;
}

/** Parse bureau scores from text. Returns scores only when confident; preserves bureau label integrity. */
export function parseScoreSnapshot(
  snapshot: string
): { Experian?: number; Equifax?: number; TransUnion?: number; needsReview?: boolean } {
  const out: { Experian?: number; Equifax?: number; TransUnion?: number } = {};
  const text = snapshot.trim();
  if (!text) return { needsReview: true };

  // Bureau-specific patterns: match bureau name/abbrev then optional colon/space then digits (300-850)
  const bureauPatterns: { key: "Experian" | "Equifax" | "TransUnion"; patterns: RegExp[] }[] = [
    { key: "Experian", patterns: [/\bExperian\s*[:\s]*(\d{3})\b/i, /\bEX\s*[:\s]*(\d{3})\b/i] },
    { key: "Equifax", patterns: [/\bEquifax\s*[:\s]*(\d{3})\b/i, /\bEQ\s*[:\s]*(\d{3})\b/i] },
    { key: "TransUnion", patterns: [/\bTransUnion\s*[:\s]*(\d{3})\b/i, /\bTU\s*[:\s]*(\d{3})\b/i] },
  ];

  for (const { key, patterns } of bureauPatterns) {
    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        const score = parseInt(m[1], 10);
        if (isValidScore(score)) {
          out[key] = score;
          break;
        }
      }
    }
  }

  const hasAny = out.Experian != null || out.Equifax != null || out.TransUnion != null;
  return { ...out, needsReview: !hasAny };
}

export function analyzeCreditReport(params: {
  fileName: string;
  type: string;
  clientName: string;
  /** When provided, use these exact scores (e.g. from user entry or extracted from report). */
  scoreOverrides?: { experian?: number; equifax?: number; transUnion?: number };
  /** Optional raw text from PDF/image OCR to extract scores. */
  rawText?: string;
}): CreditAnalysis {
  const { clientName, scoreOverrides, rawText } = params;
  const negativeItems: NegativeItemInput[] = [
    {
      accountName: "Sample Collection Account",
      bureau: "Experian",
      accountType: "Collection",
      balance: 500,
      negativeReason: "Collection account",
    },
    {
      accountName: "Sample Late Payment",
      bureau: "Equifax",
      accountType: "Credit Card",
      balance: 0,
      negativeReason: "30-day late",
    },
  ];

  const collectionsCount = negativeItems.filter(
    (i) => i.accountType?.toLowerCase().includes("collection")
  ).length;
  const chargeOffsCount = 0;
  const hardInquiriesCount = 2;
  const utilizationPct = 35;
  const openAccountsCount = 3;
  const positiveTradelinesCount = 2;

  const summaryIssues = [
    collectionsCount && `${collectionsCount} collection(s)`,
    chargeOffsCount && `${chargeOffsCount} charge-off(s)`,
    hardInquiriesCount && `${hardInquiriesCount} hard inquiry(ies)`,
  ]
    .filter(Boolean)
    .join("; ") || "Review your report for details.";

  const recommendedSteps =
    "1) Dispute inaccurate items with the bureaus. 2) Pay or settle collections if valid. 3) Reduce utilization below 30%. 4) Limit new credit applications.";

  const fundingReadinessScore = Math.max(
    0,
    100 -
      collectionsCount * 15 -
      chargeOffsCount * 20 -
      (utilizationPct > 30 ? 10 : 0) -
      hardInquiriesCount * 2
  );

  const capitalReadinessNotes =
    "Focus on removing negative items and lowering utilization to improve funding readiness.";

  let experianScore: number | undefined;
  let equifaxScore: number | undefined;
  let transUnionScore: number | undefined;

  if (scoreOverrides) {
    if (scoreOverrides.experian != null && isValidScore(scoreOverrides.experian))
      experianScore = scoreOverrides.experian;
    if (scoreOverrides.equifax != null && isValidScore(scoreOverrides.equifax))
      equifaxScore = scoreOverrides.equifax;
    if (scoreOverrides.transUnion != null && isValidScore(scoreOverrides.transUnion))
      transUnionScore = scoreOverrides.transUnion;
  }
  if (rawText) {
    const parsed = parseScoreSnapshot(rawText);
    if (experianScore == null && parsed.Experian != null) experianScore = parsed.Experian;
    if (equifaxScore == null && parsed.Equifax != null) equifaxScore = parsed.Equifax;
    if (transUnionScore == null && parsed.TransUnion != null) transUnionScore = parsed.TransUnion;
  }

  const scoreSnapshot =
    experianScore != null || equifaxScore != null || transUnionScore != null
      ? [experianScore != null ? `EX: ${experianScore}` : "", equifaxScore != null ? `EQ: ${equifaxScore}` : "", transUnionScore != null ? `TU: ${transUnionScore}` : ""]
          .filter(Boolean)
          .join(", ")
      : null;

  return {
    clientName,
    scoreSnapshot: scoreSnapshot || null,
    negativeItems,
    collectionsCount,
    chargeOffsCount,
    latePaymentsCount: 0,
    repossessionsCount: 0,
    bankruptciesCount: 0,
    hardInquiriesCount,
    utilizationPct,
    openAccountsCount,
    positiveTradelinesCount,
    summaryIssues,
    recommendedSteps,
    fundingReadinessScore,
    capitalReadinessNotes,
  };
}

export async function createAuditFromAnalysis(
  clientProfileId: string,
  clientName: string,
  analysis: CreditAnalysis,
  sourceFilePath?: string
): Promise<{ id: string; pdfPath: string | null }> {
  const auditDate = new Date();

  const pdfPath = await generateAuditPdf({
    clientName,
    auditDate,
    scoreSnapshot: analysis.scoreSnapshot,
    negativeCount: analysis.negativeItems.length,
    collectionsCount: analysis.collectionsCount,
    chargeOffsCount: analysis.chargeOffsCount,
    hardInquiriesCount: analysis.hardInquiriesCount,
    utilizationPct: analysis.utilizationPct,
    summaryIssues: analysis.summaryIssues,
    recommendedSteps: analysis.recommendedSteps,
    fundingReadinessScore: analysis.fundingReadinessScore,
    capitalReadinessNotes: analysis.capitalReadinessNotes,
  });

  const audit = await prisma.audit.create({
    data: {
      clientProfileId,
      auditDate,
      clientName,
      scoreSnapshot: analysis.scoreSnapshot,
      negativeCount: analysis.negativeItems.length,
      collectionsCount: analysis.collectionsCount,
      chargeOffsCount: analysis.chargeOffsCount,
      hardInquiriesCount: analysis.hardInquiriesCount,
      utilizationPct: analysis.utilizationPct,
      summaryIssues: analysis.summaryIssues,
      recommendedSteps: analysis.recommendedSteps,
      fundingReadinessScore: analysis.fundingReadinessScore,
      capitalReadinessNotes: analysis.capitalReadinessNotes,
      pdfPath,
    },
  });

  // Upsert funding readiness
  await prisma.fundingReadiness.upsert({
    where: { clientProfileId },
    create: {
      clientProfileId,
      score: analysis.fundingReadinessScore,
      stage: analysis.fundingReadinessScore >= 70 ? "Building" : "Credit repair priority",
      nextActions: analysis.recommendedSteps,
      utilizationPct: analysis.utilizationPct,
      negativeItemsCount: analysis.negativeItems.length,
      notes: analysis.capitalReadinessNotes,
    },
    update: {
      score: analysis.fundingReadinessScore,
      nextActions: analysis.recommendedSteps,
      utilizationPct: analysis.utilizationPct,
      negativeItemsCount: analysis.negativeItems.length,
      notes: analysis.capitalReadinessNotes,
    },
  });

  // Record score history from snapshot; only store when not needsReview
  if (analysis.scoreSnapshot) {
    const parsed = parseScoreSnapshot(analysis.scoreSnapshot);
    if (!parsed.needsReview) {
      for (const bureau of ["Experian", "Equifax", "TransUnion"] as const) {
        const score = parsed[bureau];
        if (score == null) continue;
        const prev = await prisma.scoreHistory.findFirst({
          where: { clientProfileId, bureau },
          orderBy: { recordedAt: "desc" },
        });
        await prisma.scoreHistory.create({
          data: {
            clientProfileId,
            bureau,
            score,
            previousScore: prev?.score ?? null,
            source: "audit",
          },
        });
      }
    }
  }

  return { id: audit.id, pdfPath };
}
