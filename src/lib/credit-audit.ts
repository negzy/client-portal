import { prisma } from "./prisma";
import type { Bureau } from "@prisma/client";
import { generateAuditPdf } from "./audit-pdf";
import {
  parseScoresFromReport,
  parseNegativeItemsFromReport,
  parseRevolvingFromReport,
  parseSummaryFromReport,
} from "./myfreescorenow-parser";

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
  /** Total revolving (credit card) balance from report, when parsed */
  totalRevolvingBalance: number | null;
  /** Total revolving (credit card) limit from report, when parsed */
  totalRevolvingLimit: number | null;
  /** Summary section from report (Total Accounts, Open/Closed, Delinquent, Balances, etc.) */
  reportSummary: {
    totalAccounts: number | null;
    openAccounts: number | null;
    closedAccounts: number | null;
    delinquent: number | null;
    balances: number | null;
    payments: string | null;
    publicRecords: number | null;
    inquiries2Years: number | null;
  };
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
  /** Optional raw text from PDF (e.g. MyFreeScoreNow classic or smart view). Scores and negative items are parsed from this. */
  rawText?: string;
}): CreditAnalysis {
  const { clientName, scoreOverrides, rawText } = params;

  // Parse from MyFreeScoreNow (or similar) PDF text when available; otherwise no sample placeholders
  let negativeItems: NegativeItemInput[] = [];
  if (rawText?.trim()) {
    const parsed = parseNegativeItemsFromReport(rawText);
    negativeItems = parsed.map((p) => ({
      accountName: p.accountName,
      bureau: p.bureau,
      accountType: p.accountType ?? undefined,
      balance: p.balance ?? undefined,
      negativeReason: p.negativeReason ?? undefined,
    }));
  }

  const collectionsCount = negativeItems.filter((i) =>
    i.accountType?.toLowerCase().includes("collection")
  ).length;
  const chargeOffsCount = negativeItems.filter((i) =>
    i.accountType?.toLowerCase().includes("charge")
  ).length;
  const hardInquiriesCount = (() => {
    const m = rawText?.match(/(?:hard\s+)?inquir(?:y|ies)\s*[:\s]*(\d+)|(\d+)\s*(?:hard\s+)?inquir/i);
    if (m) {
      const n = parseInt(m[1] ?? m[2] ?? "0", 10);
      if (Number.isFinite(n) && n >= 0 && n <= 50) return n;
    }
    return 0;
  })();
  const revolving = rawText ? parseRevolvingFromReport(rawText) : null;
  const summaryFromReport = rawText ? parseSummaryFromReport(rawText) : null;
  const utilizationPct: number | null = (() => {
    const m = rawText?.match(/(?:utilization|util)\s*[:\s]*(\d+(?:\.\d+)?)\s*%?/i);
    if (m) {
      const n = parseFloat(m[1]);
      if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
    }
    return revolving?.utilizationPct ?? null;
  })();
  const totalRevolvingBalance = revolving?.totalRevolvingBalance ?? summaryFromReport?.balances ?? null;
  const totalRevolvingLimit = revolving?.totalRevolvingLimit ?? null;
  const reportSummary = summaryFromReport ?? {
    totalAccounts: null,
    openAccounts: null,
    closedAccounts: null,
    delinquent: null,
    balances: null,
    payments: null,
    publicRecords: null,
    inquiries2Years: null,
  };
  const openAccountsCount = rawText?.match(/\bopen\s+account/gi)?.length ?? 0;
  const positiveTradelinesCount = 0;

  const summaryIssues = [
    collectionsCount ? `${collectionsCount} collection(s)` : "",
    chargeOffsCount ? `${chargeOffsCount} charge-off(s)` : "",
    hardInquiriesCount ? `${hardInquiriesCount} hard inquiry(ies)` : "",
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
      (utilizationPct != null && utilizationPct > 30 ? 10 : 0) -
      Math.min(hardInquiriesCount, 10) * 2
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
    const fromReport = parseScoresFromReport(rawText);
    const fromSnapshot = parseScoreSnapshot(rawText);
    if (experianScore == null)
      experianScore = fromReport.Experian ?? fromSnapshot.Experian ?? undefined;
    if (equifaxScore == null)
      equifaxScore = fromReport.Equifax ?? fromSnapshot.Equifax ?? undefined;
    if (transUnionScore == null)
      transUnionScore = fromReport.TransUnion ?? fromSnapshot.TransUnion ?? undefined;
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
    totalRevolvingBalance,
    totalRevolvingLimit,
    reportSummary,
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
    totalRevolvingBalance: analysis.totalRevolvingBalance,
    totalRevolvingLimit: analysis.totalRevolvingLimit,
    reportSummary: analysis.reportSummary,
    summaryIssues: analysis.summaryIssues,
    recommendedSteps: analysis.recommendedSteps,
    capitalReadinessNotes: analysis.capitalReadinessNotes,
    negativeItems: analysis.negativeItems.map((item) => ({
      accountName: item.accountName,
      bureau: item.bureau,
      accountType: item.accountType ?? null,
      balance: item.balance ?? null,
      negativeReason: item.negativeReason ?? null,
    })),
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
