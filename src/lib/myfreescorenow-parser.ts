/**
 * Parser for MyFreeScoreNow 3-Bureau Credit Report (classic and smart view PDFs).
 * Extracts scores and negative items from raw text extracted from uploaded PDFs.
 */

import type { Bureau } from "@prisma/client";

export type ParsedNegativeItem = {
  accountName: string;
  bureau: Bureau;
  accountType?: string | null;
  balance?: number | null;
  negativeReason?: string | null;
};

const BUREAUS: Bureau[] = ["Experian", "Equifax", "TransUnion"];

/** Score patterns: bureau name/abbrev then optional punctuation then 3-digit score (300-850) */
const SCORE_PATTERNS: { key: Bureau; patterns: RegExp[] }[] = [
  { key: "Experian", patterns: [/\bExperian\s*[:\s\-]*(\d{3})\b/i, /\bEX\s*[:\s\-]*(\d{3})\b/i] },
  { key: "Equifax", patterns: [/\bEquifax\s*[:\s\-]*(\d{3})\b/i, /\bEQ\s*[:\s\-]*(\d{3})\b/i] },
  { key: "TransUnion", patterns: [/\bTransUnion\s*[:\s\-]*(\d{3})\b/i, /\bTU\s*[:\s\-]*(\d{3})\b/i] },
];

const SCORE_MIN = 300;
const SCORE_MAX = 850;

function isValidScore(n: number): boolean {
  return Number.isInteger(n) && n >= SCORE_MIN && n <= SCORE_MAX;
}

/**
 * Parse all three bureau scores from report text.
 * Works with both classic and smart view layouts.
 */
export function parseScoresFromReport(
  text: string
): { Experian?: number; Equifax?: number; TransUnion?: number } {
  const out: { Experian?: number; Equifax?: number; TransUnion?: number } = {};
  const t = text.trim();
  if (!t) return out;

  for (const { key, patterns } of SCORE_PATTERNS) {
    for (const p of patterns) {
      const m = t.match(p);
      if (m) {
        const score = parseInt(m[1], 10);
        if (isValidScore(score)) {
          out[key] = score;
          break;
        }
      }
    }
  }
  return out;
}

/** Negative account type keywords (report wording) */
const NEGATIVE_TYPES = [
  "collection",
  "charge-off",
  "charge off",
  "chargeoff",
  "late 30",
  "30 days late",
  "late 60",
  "60 days late",
  "late 90",
  "90 days late",
  "delinquent",
  "past due",
  "derogatory",
  "closed",
  "charged off",
  "default",
  "repossession",
  "foreclosure",
  "bankruptcy",
  "settled",
  "paid collection",
  "medical collection",
];

/** Detect bureau from a line or context (e.g. "Experian" or "EX" in same line/section) */
function detectBureau(line: string): Bureau | null {
  if (/\bExperian\b|^EX\b|\bEX\s/i.test(line)) return "Experian";
  if (/\bEquifax\b|^EQ\b|\bEQ\s/i.test(line)) return "Equifax";
  if (/\bTransUnion\b|^TU\b|\bTU\s/i.test(line)) return "TransUnion";
  return null;
}

/** Extract dollar amount from line, e.g. $1,234.56 or 1234 */
function parseBalance(line: string): number | null {
  const m = line.match(/\$[\d,]+(?:\.\d{2})?|(?<!\d)(\d{1,6})(?:\.\d{2})?(?!\d)/);
  if (!m) return null;
  const raw = (m[1] ?? m[0]).replace(/[$,]/g, "");
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Parse negative items from report text.
 * Looks for section headers (Negative, Collection, Derogatory, etc.) and account-like lines
 * with creditor name, type, balance, and bureau. Works with both classic and smart view.
 */
export function parseNegativeItemsFromReport(text: string): ParsedNegativeItem[] {
  const items: ParsedNegativeItem[] = [];
  const t = text.trim();
  if (!t) return items;

  const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const lower = t.toLowerCase();

  // Find lines that mention a negative type
  const negativeTypeRegex = new RegExp(
    NEGATIVE_TYPES.join("|").replace(/\s+/g, "\\s*"),
    "i"
  );

  // Also look for "Collection", "Charge-Off" as standalone words
  const sectionHeaders = [
    /negative\s+(?:account|items?|tradelines?)/i,
    /accounts?\s+in\s+collection/i,
    /collection\s+accounts?/i,
    /charge-?offs?/i,
    /derogatory/i,
    /adverse\s+items?/i,
    /past\s+due/i,
    /delinquent/i,
    /account\s+history/i,
  ];

  let currentBureau: Bureau | null = null;
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // Update current bureau from section/line context
    const bureauInLine = detectBureau(line);
    if (bureauInLine) currentBureau = bureauInLine;

    // Section header: next few lines may be account details
    const isSection = sectionHeaders.some((r) => r.test(line));
    if (isSection) continue;

    // Check if this line describes a negative item (type keyword or "Collection"/"Charge-off" etc.)
    const hasNegativeType =
      negativeTypeRegex.test(line) ||
      /\bcollection\b/i.test(line) ||
      /\bcharge-?off\b/i.test(line) ||
      /\b(30|60|90)\s*day\s*late\b/i.test(line) ||
      /\blate\s+payment\b/i.test(line);

    if (!hasNegativeType) continue;

    const balance = parseBalance(line);
    const bureau: Bureau = bureauInLine ?? currentBureau ?? "Experian";

    // Creditor/account name: often the first substantial phrase (skip "Experian", "Equifax", page numbers)
    let accountName = line
      .replace(/\b(Experian|Equifax|TransUnion|EX|EQ|TU)\b/gi, "")
      .replace(/\$\d[\d,.]*/g, "")
      .replace(/\d{3}-\d{2}-\d{4}/g, "") // SSN
      .replace(/^\s*[\d.]+\s*/, "")
      .trim();
    const firstNegativeWord = lineLower.match(
      new RegExp(
        "(.{0,80})(" + NEGATIVE_TYPES.slice(0, 12).join("|").replace(/\s+/g, "\\s+") + ")",
        "i"
      )
    );
    if (firstNegativeWord) {
      const before = firstNegativeWord[1].trim();
      const possibleName = before.replace(/\b(Experian|Equifax|TransUnion|EX|EQ|TU)\b/gi, "").trim();
      if (possibleName.length >= 2 && possibleName.length <= 80) accountName = possibleName;
    }
    if (accountName.length < 2) accountName = line.slice(0, 60).trim() || "Unknown account";

    // Normalize for dedupe: same name + bureau + type-ish
    const typeMatch = lineLower.match(/collection|charge-?off|charge\s*off|late\s*\d+|delinquent|derogatory/i);
    const typeStr = typeMatch ? typeMatch[0] : "Negative";
    const dedupeKey = `${accountName}|${bureau}|${typeStr}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const accountType =
      /collection/i.test(lineLower) ? "Collection"
      : /charge-?off|charge\s*off/i.test(lineLower) ? "Charge-off"
      : /late\s*30|30\s*day/i.test(lineLower) ? "Late 30"
      : /late\s*60|60\s*day/i.test(lineLower) ? "Late 60"
      : /late\s*90|90\s*day/i.test(lineLower) ? "Late 90"
      : /delinquent|past\s+due/i.test(lineLower) ? "Delinquent"
      : typeStr;

    items.push({
      accountName: accountName.slice(0, 255),
      bureau,
      accountType,
      balance: balance ?? undefined,
      negativeReason: typeStr,
    });
  }

  // If we found no items by line scan, try block scan: split by double newline and look for blocks containing negative keywords + bureau
  if (items.length === 0 && t.length > 200) {
    const blocks = t.split(/\n\s*\n+/);
    for (const block of blocks) {
      if (!negativeTypeRegex.test(block) && !/\bcollection\b/i.test(block)) continue;
      const bureau =
        detectBureau(block) ??
        (/\bExperian\b/i.test(block) ? "Experian" : /\bEquifax\b/i.test(block) ? "Equifax" : "TransUnion");
      const balance = parseBalance(block);
      const nameMatch = block.match(/^([^\n]{5,80})/m);
      const accountName = (nameMatch ? nameMatch[1].trim() : block.slice(0, 60).trim()) || "Unknown account";
      const typeMatch = block.match(/collection|charge-?off|charge\s*off|late\s*\d+|delinquent/i);
      const accountType = typeMatch ? typeMatch[0] : "Negative";
      const dedupeKey = `${accountName}|${bureau}|${accountType}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      items.push({
        accountName: accountName.slice(0, 255),
        bureau,
        accountType,
        balance: balance ?? undefined,
        negativeReason: accountType,
      });
    }
  }

  return items;
}
