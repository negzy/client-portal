import { prisma } from "./prisma";
import type { Bureau } from "@prisma/client";
import { generateAuditPdf } from "./audit-pdf";
import {
  parseScoresFromReport,
  parseNegativeItemsFromReport,
  parseRevolvingFromReport,
  parseSummaryFromReport,
  parseHardInquiryCountFromReport,
  parseFactorsAffectingFromReport,
  parseTradelinePastDueNegatives,
} from "./myfreescorenow-parser";

export type FactorsAffectingReport = {
  equifax: string[];
  experian: string[];
  transUnion: string[];
};

const LATE_MATRIX_SEVERITIES = ["Late 30", "Late 60", "Late 90", "Late 120"] as const;
type LateMatrixSeverity = (typeof LATE_MATRIX_SEVERITIES)[number];

function parseLateReportCountFromReason(reason: string | null | undefined): number {
  if (!reason) return 1;
  const m = reason.match(/report count:\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : 1;
}

function isLateMatrixSeverity(t: string | null | undefined): t is LateMatrixSeverity {
  return (
    t === "Late 30" || t === "Late 60" || t === "Late 90" || t === "Late 120"
  );
}

export type LatePaymentMatrixRow = {
  accountName: string;
  cell30: string;
  cell60: string;
  cell90: string;
  cell120: string;
  rowTotal: number;
};

export type LatePaymentMatrix = {
  rows: LatePaymentMatrixRow[];
  grandTotal: number;
};

/** One row per account; cells show EQ:/EX:/TU: counts from the report past-due table. */
export function buildLatePaymentMatrixFromNegativeItems(items: NegativeItemInput[]): LatePaymentMatrix {
  const bureaus = ["Equifax", "Experian", "TransUnion"] as const;
  const byAccount = new Map<string, Map<LateMatrixSeverity, Map<string, number>>>();

  for (const it of items) {
    if (!isLateMatrixSeverity(it.accountType)) continue;
    const sev = it.accountType;
    const bureau = it.bureau;
    const n = parseLateReportCountFromReason(it.negativeReason);
    if (!byAccount.has(it.accountName)) {
      const m = new Map<LateMatrixSeverity, Map<string, number>>();
      for (const s of LATE_MATRIX_SEVERITIES) m.set(s, new Map());
      byAccount.set(it.accountName, m);
    }
    const am = byAccount.get(it.accountName)!;
    const sm = am.get(sev)!;
    sm.set(bureau, Math.max(sm.get(bureau) ?? 0, n));
  }

  function formatCell(bureauMap: Map<string, number>): string {
    const parts: string[] = [];
    for (const b of bureaus) {
      const num = bureauMap.get(b) ?? 0;
      if (num <= 0) continue;
      const abbr = b === "Equifax" ? "EQ" : b === "Experian" ? "EX" : "TU";
      parts.push(`${abbr}:${num}`);
    }
    return parts.length > 0 ? parts.join(" ") : "—";
  }

  const accountsSorted = Array.from(byAccount.keys()).sort((a, b) => a.localeCompare(b));
  const rows: LatePaymentMatrixRow[] = [];
  let grandTotal = 0;

  for (const acc of accountsSorted) {
    const am = byAccount.get(acc)!;
    let rowSum = 0;
    for (const sev of LATE_MATRIX_SEVERITIES) {
      const bm = am.get(sev)!;
      for (const b of bureaus) rowSum += bm.get(b) ?? 0;
    }
    grandTotal += rowSum;
    rows.push({
      accountName: acc,
      cell30: formatCell(am.get("Late 30")!),
      cell60: formatCell(am.get("Late 60")!),
      cell90: formatCell(am.get("Late 90")!),
      cell120: formatCell(am.get("Late 120")!),
      rowTotal: rowSum,
    });
  }

  return { rows, grandTotal };
}

function mergeNegativeItems(items: NegativeItemInput[]): NegativeItemInput[] {
  const map = new Map<string, NegativeItemInput>();
  for (const it of items) {
    const key = `${it.accountName}|${it.bureau}|${it.accountType ?? ""}|${it.negativeReason ?? ""}`;
    map.set(key, it);
  }
  return Array.from(map.values());
}

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
  hardInquiriesPerBureau: { equifax: number; experian: number; transUnion: number } | null;
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
  /** Score factors as they appear on the 3-bureau report */
  factorsAffecting: FactorsAffectingReport;
  /** Account × 30/60/90/120 past-due counts from structured parse */
  latePaymentMatrix: LatePaymentMatrix;
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
    {
      key: "Experian",
      patterns: [
        /\bExperian\s*\d*\s+(\d{3})(?:\s|$)/i,
        /\bExperian\s*[:\s]*(\d{3})\b/i,
        /\bEX\s*[:\s]*(\d{3})\b/i,
      ],
    },
    {
      key: "Equifax",
      patterns: [
        /\bEquifax\s*\d*\s+(\d{3})(?:\s|$)/i,
        /\bEquifax\s*[:\s]*(\d{3})\b/i,
        /\bEQ\s*[:\s]*(\d{3})\b/i,
      ],
    },
    {
      key: "TransUnion",
      patterns: [
        /\bTransUnion\s*\d*\s+(\d{3})(?:\s|$)/i,
        /\bTransUnion\s*[:\s]*(\d{3})\b/i,
        /\bTU\s*[:\s]*(\d{3})\b/i,
      ],
    },
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

  const factorsAffecting = rawText?.trim()
    ? parseFactorsAffectingFromReport(rawText)
    : { equifax: [], experian: [], transUnion: [] };

  let negativeItems: NegativeItemInput[] = [];
  if (rawText?.trim()) {
    const fromReport = parseNegativeItemsFromReport(rawText);
    const fromPastDue = parseTradelinePastDueNegatives(rawText);
    negativeItems = mergeNegativeItems([
      ...fromReport.map((p) => ({
        accountName: p.accountName,
        bureau: p.bureau,
        accountType: p.accountType ?? undefined,
        balance: p.balance ?? undefined,
        negativeReason: p.negativeReason ?? undefined,
      })),
      ...fromPastDue.map((p) => ({
        accountName: p.accountName,
        bureau: p.bureau,
        accountType: p.accountType ?? undefined,
        balance: p.balance ?? undefined,
        negativeReason: p.negativeReason ?? undefined,
      })),
    ]);
  }

  const collectionsCount = negativeItems.filter((i) =>
    i.accountType?.toLowerCase().includes("collection")
  ).length;
  const chargeOffsCount = negativeItems.filter((i) =>
    i.accountType?.toLowerCase().includes("charge")
  ).length;
  const hardInqParsed = rawText?.trim() ? parseHardInquiryCountFromReport(rawText) : null;
  const hardInquiriesCount = hardInqParsed?.displayMax ?? 0;
  const hardInquiriesPerBureau = hardInqParsed?.perBureau ?? null;
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

  const latePaymentsCount = negativeItems.filter((i) =>
    /late\s*(?:30|60|90|120)\b/i.test(i.accountType ?? "")
  ).length;
  const latePaymentMatrix = buildLatePaymentMatrixFromNegativeItems(negativeItems);

  const summaryIssues = [
    collectionsCount ? `${collectionsCount} collection(s)` : "",
    chargeOffsCount ? `${chargeOffsCount} charge-off(s)` : "",
    latePaymentsCount
      ? `${latePaymentsCount} late-payment tradeline detail(s) (30/60/90/120 from account sections)`
      : "",
    hardInquiriesCount
      ? `${hardInquiriesCount} hard inquiry(ies)${
          hardInqParsed?.perBureau
            ? ` (EQ ${hardInqParsed.perBureau.equifax}, EX ${hardInqParsed.perBureau.experian}, TU ${hardInqParsed.perBureau.transUnion})`
            : ""
        }`
      : "",
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
      Math.min(latePaymentsCount, 20) * 3 -
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
    latePaymentsCount,
    repossessionsCount: 0,
    bankruptciesCount: 0,
    hardInquiriesCount,
    hardInquiriesPerBureau,
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
    factorsAffecting,
    latePaymentMatrix,
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
    hardInquiriesPerBureau: analysis.hardInquiriesPerBureau,
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
    factorsAffecting: analysis.factorsAffecting,
    latePaymentMatrix: analysis.latePaymentMatrix,
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
