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
  {
    key: "Equifax",
    patterns: [
      /\bEquifax\s*\d*\s+(\d{3})(?:\s|$)/i,
      /\bEquifax\s*[:\s\-]*(\d{3})\b/i,
      /\bEQ\s*[:\s\-]*(\d{3})\b/i,
    ],
  },
  {
    key: "Experian",
    patterns: [
      /\bExperian\s*\d*\s+(\d{3})(?:\s|$)/i,
      /\bExperian\s*[:\s\-]*(\d{3})\b/i,
      /\bEX\s*[:\s\-]*(\d{3})\b/i,
    ],
  },
  {
    key: "TransUnion",
    patterns: [
      /\bTransUnion\s*\d*\s+(\d{3})(?:\s|$)/i,
      /\bTransUnion\s*[:\s\-]*(\d{3})\b/i,
      /\bTU\s*[:\s\-]*(\d{3})\b/i,
    ],
  },
];

const SCORE_MIN = 300;
const SCORE_MAX = 850;

function isValidScore(n: number): boolean {
  return Number.isInteger(n) && n >= SCORE_MIN && n <= SCORE_MAX;
}

/**
 * Parse all three bureau scores from report text.
 * Works with both classic and smart view layouts. Uses multiple strategies.
 */
export function parseScoresFromReport(
  text: string
): { Experian?: number; Equifax?: number; TransUnion?: number } {
  const out: { Experian?: number; Equifax?: number; TransUnion?: number } = {};
  const t = text.trim();
  if (!t) return out;

  // Strategy 1: bureau name/abbrev followed by 3-digit score
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

  // Strategy 2: score then bureau (e.g. "691 06/20/2025 Experian") — only valid FICO/Vantage range
  const scoreThenBureau = Array.from(
    t.matchAll(/(\d{3})\s*[\d/\s,.]*\s*(Experian|Equifax|TransUnion)\b/gi)
  );
  for (const m of scoreThenBureau) {
    const score = parseInt(m[1], 10);
    const bureau = m[2].toLowerCase();
    if (!isValidScore(score)) continue;
    if (bureau.includes("experian") && out.Experian == null) out.Experian = score;
    if (bureau.includes("equifax") && out.Equifax == null) out.Equifax = score;
    if (bureau.includes("transunion") && out.TransUnion == null) out.TransUnion = score;
  }

  // Strategy 3: bureau name within ~120 chars of a 3-digit score (any order)
  for (const key of BUREAUS) {
    if (out[key] != null) continue;
    const regex = new RegExp(
      `(?:${key}[^0-9]{0,120}?(\\d{3})|(\\d{3})[^0-9]{0,120}?${key})`,
      "i"
    );
    const match = t.match(regex);
    if (match) {
      const scoreStr = match[1] ?? match[2];
      if (scoreStr) {
        const score = parseInt(scoreStr, 10);
        if (isValidScore(score)) out[key] = score;
      }
    }
  }

  return out;
}

/**
 * Human-readable creditor line (PDF often uses THD/CBNA, all-caps, etc.).
 */
export function prettifyCreditorName(raw: string): string {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return s;
  if (s.length > 80) return s.slice(0, 80).trim();
  // Split slash segments: THD/CBNA → nicer spacing
  if (s.includes("/")) {
    return s
      .split(/\s*\/\s*/)
      .map((part) =>
        part
          .split(/\s+/)
          .map((w) => {
            if (w.length <= 2 && w === w.toLowerCase()) return w.toUpperCase();
            if (/^[A-Z0-9]+$/.test(w) && w.length > 1) {
              return w.charAt(0) + w.slice(1).toLowerCase();
            }
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          })
          .join(" ")
      )
      .join(" / ");
  }
  return s
    .split(/\s+/)
    .map((w) => {
      if (/^[A-Z0-9]{2,}$/.test(w)) return w.charAt(0) + w.slice(1).toLowerCase();
      return w;
    })
    .join(" ");
}

/**
 * Hard-style inquiry counts from 3-bureau summary (NOT soft pulls).
 * Uses the "Other Credit Items" row: Inquiries EQ EX TU — we take the max across bureaus
 * so one real inquiry that appears on all three is not triple-counted in the audit headline.
 */
export function parseHardInquiryCountFromReport(text: string): {
  perBureau: { equifax: number; experian: number; transUnion: number } | null;
  /** Use for audit & funding readiness headline */
  displayMax: number | null;
} {
  const t = text.trim();
  if (!t) return { perBureau: null, displayMax: null };

  const asTriple = (a: string, b: string, c: string) => {
    const x = parseInt(a, 10);
    const y = parseInt(b, 10);
    const z = parseInt(c, 10);
    if (![x, y, z].every((n) => Number.isFinite(n) && n >= 0 && n <= 999)) return null;
    return { equifax: x, experian: y, transUnion: z, max: Math.max(x, y, z) };
  };

  // Same line often: "Personal Information 6 5 6 Inquiries 0 1 6"
  const glued = t.match(
    /Personal Information\s+\d{1,3}\s+\d{1,3}\s+\d{1,3}\s+Inquiries\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\b/i
  );
  if (glued) {
    const r = asTriple(glued[1], glued[2], glued[3]);
    if (r) {
      return {
        perBureau: { equifax: r.equifax, experian: r.experian, transUnion: r.transUnion },
        displayMax: r.max,
      };
    }
  }

  // "Other Credit Items" block: header row Equifax / Experian / TransUnion then summary lines
  const oci = t.match(
    /Other Credit Items[\s\S]{0,4000}?(?=2\.\s*Revolving|2\.\d+\s+|Experian Accounts Summary|Mar \d+,\s*20\d{2} Three Bureau)/i
  );
  if (oci) {
    const block = oci[0];
    const row = block.match(/\bInquiries\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\b/i);
    if (row) {
      const r = asTriple(row[1], row[2], row[3]);
      if (r) {
        return {
          perBureau: { equifax: r.equifax, experian: r.experian, transUnion: r.transUnion },
          displayMax: r.max,
        };
      }
    }
  }

  // Section 9 actual lines: count explicit "hard" inquiries only (avoids soft / promo noise)
  const sec9 = t.match(/9\.\s*Inquiries[\s\S]{0,15000}?(?=10\.\s*Public Records|11\.\s*Collections|12\.\s*Dispute|$)/i);
  if (sec9) {
    const hard = sec9[0].match(/\bhard\s+inquir(?:y|ies)\b/gi);
    if (hard && hard.length > 0) {
      return { perBureau: null, displayMax: hard.length };
    }
  }

  return { perBureau: null, displayMax: null };
}

/**
 * Verbatim-style factors under "Factors affecting your credit score" (Equifax / Experian / TransUnion blocks).
 */
export function parseFactorsAffectingFromReport(text: string): {
  equifax: string[];
  experian: string[];
  transUnion: string[];
} {
  const empty = { equifax: [] as string[], experian: [] as string[], transUnion: [] as string[] };
  const m = text.match(
    /Factors affecting your credit score\s+Equifax\s+([\s\S]+?)\s+Experian\s+([\s\S]+?)\s+TransUnion\s+([\s\S]+?)(?=\s+Mar \d+,\s*\d{4})/i
  );
  if (!m) return empty;
  const splitBody = (body: string) =>
    body
      .split(/\s+(?=You have\b|Lack of\b|The date that\b|The number of\b)/i)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length > 8);
  return {
    equifax: splitBody(m[1]),
    experian: splitBody(m[2]),
    transUnion: splitBody(m[3]),
  };
}

const BUREAU_ORDER_PASTDUE: Bureau[] = ["Equifax", "Experian", "TransUnion"];

function parsePastDueTripletVal(raw: string): number {
  const t = raw.trim().toUpperCase();
  if (t === "N/A") return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Per tradeline subsection (e.g. 2.1 Thd/cbna): read Account Details-style rows
 * 30/60/90/120 Days Past Due with Equifax / Experian / TransUnion columns.
 */
export function parseTradelinePastDueNegatives(text: string): ParsedNegativeItem[] {
  const items: ParsedNegativeItem[] = [];
  const seen = new Set<string>();
  const t = text.trim();
  if (!t) return items;

  const parts = t.split(/(?=\d+\.\d+\s+)/);
  const severities: { pattern: string; type: string }[] = [
    { pattern: "30\\s*Days\\s*Past\\s*Due", type: "Late 30" },
    { pattern: "60\\s*Days\\s*Past\\s*Due", type: "Late 60" },
    { pattern: "90\\s*Days\\s*Past\\s*Due", type: "Late 90" },
    { pattern: "120\\s*Days\\s*Past\\s*Due", type: "Late 120" },
  ];

  for (const part of parts) {
    const head = part.match(
      /^\d+\.\d+\s+(.+?)(?=\s+(?:Your debt-to-credit|Payment History|The tables below shows|Account Details)\b)/i
    );
    if (!head) continue;
    let creditor = head[1].replace(/\s*\(CLOSED\)\s*$/i, "").trim();
    creditor = creditor.replace(/\s+Your\s+debt-to-credit.*$/i, "").trim();
    if (creditor.length < 2 || creditor.length > 80) continue;
    if (/^(payment history|account details|revolving)$/i.test(creditor)) continue;

    for (const { pattern, type } of severities) {
      const re = new RegExp(
        `${pattern}\\s+(\\d+|N\\/A)\\s+(\\d+|N\\/A)\\s+(\\d+|N\\/A)`,
        "i"
      );
      const rm = part.match(re);
      if (!rm) continue;
      const counts = [parsePastDueTripletVal(rm[1]), parsePastDueTripletVal(rm[2]), parsePastDueTripletVal(rm[3])];
      for (let bi = 0; bi < 3; bi++) {
        const n = counts[bi];
        if (n <= 0) continue;
        const bureau = BUREAU_ORDER_PASTDUE[bi];
        const key = `${creditor}|${bureau}|${type}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
          accountName: prettifyCreditorName(creditor).slice(0, 255),
          bureau,
          accountType: type,
          negativeReason: `${type} (report count: ${n})`,
        });
      }
    }
  }
  return items;
}

/** MyFreeScoreNow / Equifax PDF: collections section with "Agency Client:" per bureau */
export function parseCollectionAccountsFromReport(text: string): ParsedNegativeItem[] {
  const items: ParsedNegativeItem[] = [];
  const sectionMatch = text.match(
    /Collections stay on your credit report[\s\S]*?(?=12\.\s*Dispute File Information|$)/i
  );
  if (!sectionMatch) return items;
  const section = sectionMatch[0];
  const seen = new Set<string>();
  const re =
    /(Experian|Equifax|TransUnion)\s+Date Reported:\s*[\s\S]*?Agency Client:\s*([^\n]+?)(?=\s+(?:Experian|Equifax|TransUnion)\s+Date Reported|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(section)) !== null) {
    const bureau = m[1] as Bureau;
    let accountName = m[2].replace(/\s+/g, " ").trim();
    accountName = accountName.replace(/\s+(?:TransUnion|Experian|Equifax)\s*$/i, "").trim();
    if (accountName.length < 2 || accountName.length > 120) continue;
    const tail = section.slice(m.index, Math.min(section.length, m.index + 500));
    const amt = tail.match(/Amount\s+\$?\s*([\d,]+(?:\.\d{2})?)/i);
    const balance = amt ? parseFloat(amt[1].replace(/,/g, "")) : undefined;
    const dedupe = `${accountName}|${bureau}|collection`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    items.push({
      accountName: accountName.slice(0, 255),
      bureau,
      accountType: "Collection",
      balance: Number.isFinite(balance) ? balance : undefined,
      negativeReason: "Collection account",
    });
  }

  if (items.length === 0) return items;

  const byBalance = new Map<number, ParsedNegativeItem[]>();
  for (const it of items) {
    const k = Math.round(Number(it.balance) || 0);
    const g = byBalance.get(k) ?? [];
    g.push(it);
    byBalance.set(k, g);
  }
  const out: ParsedNegativeItem[] = [];
  for (const group of Array.from(byBalance.values())) {
    const bestName = group.reduce(
      (best, g) => (g.accountName.length > best.length ? g.accountName : best),
      group[0].accountName
    );
    const canonical = prettifyCreditorName(bestName).slice(0, 255);
    for (const g of group) {
      out.push({ ...g, accountName: canonical });
    }
  }
  return out;
}

function isCreditEducationBoilerplate(line: string): boolean {
  const t = line.trim();
  return (
    /^you have\b/i.test(t) ||
    /^lack of\b/i.test(t) ||
    /^the date that\b/i.test(t) ||
    /^you have either\b/i.test(t) ||
    /^the number of inquiries\b/i.test(t) ||
    /factors affecting your credit score/i.test(t) ||
    /proprietary credit model/i.test(t) ||
    /vantagescore/i.test(t) ||
    /educational use/i.test(t)
  );
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
  let currentSubsectionCreditor: string | null = null;
  const seen = new Set<string>();

  // Blocklist: never use these as account name (score partners, product names, headers)
  const NOT_ACCOUNT_NAME =
    /vantage\s*score|credit\s*score\s*partner|powered\s+by|three\s+bureau|credit\s*report|page\s+\d+\s+of\s+\d+|partnered|\.0\s*credit|experian\s*score|equifax\s*score|transunion\s*score|fico|score\s*summary|your\s*score|report\s*date|account\s*number\s*:\s*\d|^\s*\d{4}\s*$|^[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+three\s+bureau/i;

  function looksLikeAccountName(s: string): boolean {
    const t = s.trim();
    if (t.length < 3 || t.length > 80) return false;
    if (NOT_ACCOUNT_NAME.test(t)) return false;
    if (negativeTypeRegex.test(t) || sectionHeaders.some((r) => r.test(t))) return false;
    if (/^(Experian|Equifax|TransUnion|EX|EQ|TU|account|creditor|name|bureau)$/i.test(t)) return false;
    if (/^\d+$|^\d+\s*[-/]\s*\d+/.test(t)) return false;
    if (/\d{3}-\d{2}-\d{4}/.test(t)) return false;
    return true;
  }

  function creditorScore(s: string): number {
    const lower = s.trim().toLowerCase();
    if (NOT_ACCOUNT_NAME.test(lower)) return -1;
    let score = 0;
    if (/\b(card|bank|jpmcb|jpmorgan|chase|capital\s*one|citi|discover|amex|wells\s*fargo|synchrony)\b/i.test(lower)) score += 2;
    if (/^[A-Za-z0-9\s\-&]+$/.test(s) && s.length <= 50) score += 1;
    if (/\d{4}\s*\*+\s*$/.test(s)) score += 1; // "1234****" style
    return score;
  }

  // Known creditor/tradeline patterns – if we find one of these in a line above the negative line, prefer it
  const CREDITOR_PATTERN = /\b(jpmcb|jpmorgan|chase|capital\s*one|citi|discover|amex|wells\s*fargo|synchrony|navy\s*federal|us\s*bank|barclays|pnc|usaa)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    if (isCreditEducationBoilerplate(line)) continue;

    // Structured Account Details table (avoid duplicate with parseTradelinePastDueNegatives)
    if (/\d+\s*Days\s*Past\s*Due\s+(\d+|N\/A)\s+(\d+|N\/A)\s+(\d+|N\/A)/i.test(line)) continue;

    // Major section "2. Revolving Accounts" — not a tradeline "2.1 Name"
    if (/^(\d+)\.\s+[A-Za-z]/.test(line) && !/^\d+\.\d+/.test(line)) {
      currentSubsectionCreditor = null;
    }

    const subAccount = line.match(/^(\d+)\.(\d+)\s+(.+)$/);
    if (subAccount) {
      let cand = subAccount[3].trim();
      cand = cand.replace(/\s*\(CLOSED\)\s*$/i, "").trim();
      const cut = cand.split(/\s+(?:Your debt-to-credit|Payment History|Account Details|Revolving)/i)[0];
      cand = cut.trim();
      if (
        cand.length >= 2 &&
        cand.length <= 70 &&
        !NOT_ACCOUNT_NAME.test(cand) &&
        !negativeTypeRegex.test(cand) &&
        !detectBureau(cand) &&
        !/^account\s+details$/i.test(cand)
      ) {
        currentSubsectionCreditor = cand;
      }
    }

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

    let accountName = "";
    if (
      currentSubsectionCreditor &&
      /\b(Past Due|Days Past Due|Charge Off|Collection Account|derogatory)\b/i.test(line)
    ) {
      accountName = currentSubsectionCreditor;
    }

    let bestScore = -1;
    const lookback = 8; // look up to 8 lines back (past "Vantage Score" etc.) to find creditor name

    if (!accountName) {
      for (let j = 1; j <= lookback && i - j >= 0; j++) {
        const prev = lines[i - j].trim();
        if (!looksLikeAccountName(prev)) continue;
        const candidate = prev.replace(/\b(Experian|Equifax|TransUnion|EX|EQ|TU)\b/gi, "").trim();
        if (candidate.length < 2) continue;
        const s = creditorScore(candidate);
        if (s > bestScore) {
          bestScore = s;
          accountName = candidate;
        }
      }
    }

    // If still no name, scan the preceding block for a line containing a known creditor pattern (e.g. JPMCB, Chase)
    if (accountName.length < 2) {
      for (let j = 1; j <= lookback && i - j >= 0; j++) {
        const prev = lines[i - j].trim();
        if (NOT_ACCOUNT_NAME.test(prev)) continue;
        if (CREDITOR_PATTERN.test(prev)) {
          const candidate = prev.replace(/\b(Experian|Equifax|TransUnion|EX|EQ|TU)\b/gi, "").trim();
          if (candidate.length >= 2 && candidate.length <= 80) {
            accountName = candidate;
            break;
          }
        }
      }
    }

    // Fallback: text before the negative keyword on the current line (still apply blocklist)
    if (accountName.length < 2) {
      let fromLine = line
        .replace(/\b(Experian|Equifax|TransUnion|EX|EQ|TU)\b/gi, "")
        .replace(/\$\d[\d,.]*/g, "")
        .replace(/\d{3}-\d{2}-\d{4}/g, "")
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
        fromLine = before.replace(/\b(Experian|Equifax|TransUnion|EX|EQ|TU)\b/gi, "").trim();
      }
      if (fromLine.length >= 2 && fromLine.length <= 80 && !NOT_ACCOUNT_NAME.test(fromLine))
        accountName = fromLine;
    }
    if (accountName.length < 2 && currentSubsectionCreditor) accountName = currentSubsectionCreditor;
    if (accountName.length < 2) accountName = line.slice(0, 60).trim() || "Unknown account";
    if (NOT_ACCOUNT_NAME.test(accountName)) accountName = "Unknown account";
    if (accountName === "Unknown account") continue;

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
      accountName: prettifyCreditorName(accountName).slice(0, 255),
      bureau,
      accountType,
      balance: balance ?? undefined,
      negativeReason: typeStr,
    });
  }

  // If we found no items by line scan, try block scan: split by double newline and look for blocks containing negative keywords + bureau
  if (items.length === 0 && t.length > 200) {
    const NOT_ACCOUNT =
      /vantage\s*score|credit\s*score\s*partner|partnered|\.0\s*credit|three\s*bureau|credit\s*report|powered\s+by|^[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+three\s+bureau/i;
    const blocks = t.split(/\n\s*\n+/);
    for (const block of blocks) {
      if (!negativeTypeRegex.test(block) && !/\bcollection\b/i.test(block)) continue;
      const bureau =
        detectBureau(block) ??
        (/\bExperian\b/i.test(block) ? "Experian" : /\bEquifax\b/i.test(block) ? "Equifax" : "TransUnion");
      const balance = parseBalance(block);
      const nameMatch = block.match(/^([^\n]{5,80})/m);
      let accountName = (nameMatch ? nameMatch[1].trim() : block.slice(0, 60).trim()) || "Unknown account";
      if (NOT_ACCOUNT.test(accountName)) accountName = "Unknown account";
      const typeMatch = block.match(/collection|charge-?off|charge\s*off|late\s*\d+|delinquent/i);
      const accountType = typeMatch ? typeMatch[0] : "Negative";
      const dedupeKey = `${accountName}|${bureau}|${accountType}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      items.push({
        accountName: prettifyCreditorName(accountName).slice(0, 255),
        bureau,
        accountType,
        balance: balance ?? undefined,
        negativeReason: accountType,
      });
    }
  }

  const fromCollections = parseCollectionAccountsFromReport(t);
  for (const c of fromCollections) {
    const k = `${c.accountName}|${c.bureau}|collection-agency`;
    if (seen.has(k)) continue;
    seen.add(k);
    items.push(c);
  }

  return items;
}

/** Match dollar amounts in text: $1,234.56 or 1234.56 */
function parseDollarAmounts(text: string): number[] {
  const amounts: number[] = [];
  const re = /\$?\s*([\d,]+(?:\.\d{2})?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 0 && n < 10_000_000) amounts.push(n);
  }
  return amounts;
}

/**
 * Parse revolving (credit card) totals from MyFreeScoreNow-style report text.
 * Looks for "Revolving", "Credit limit", "Balance", "High balance", "Total", "Available credit".
 * Returns total balance, total limit, and computed utilization % for the PDF.
 */
export function parseRevolvingFromReport(text: string): {
  totalRevolvingBalance: number | null;
  totalRevolvingLimit: number | null;
  utilizationPct: number | null;
} {
  const t = text.trim();
  if (!t || t.length < 100) return { totalRevolvingBalance: null, totalRevolvingLimit: null, utilizationPct: null };

  const lower = t.toLowerCase();
  let totalBalance: number | null = null;
  let totalLimit: number | null = null;

  // MyFreeScoreNow / common patterns: "Total balance" $X, "Credit limit" $Y, "Total credit" $Z, "Revolving balance"
  const balancePatterns = [
    /total\s+(?:revolving\s+)?balance\s*[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /revolving\s+balance\s*[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:total\s+)?balance\s*[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /balances?\s+(?:total|are)\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
  ];
  for (const p of balancePatterns) {
    const m = t.match(p);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n >= 0) {
        totalBalance = n;
        break;
      }
    }
  }

  const limitPatterns = [
    /total\s+(?:revolving\s+)?(?:credit\s+)?limit\s*[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:credit\s+)?limit\s*[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /available\s+credit\s*[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /total\s+credit\s*[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /revolving\s+limit\s*[:\s]*\$?\s*([\d,]+(?:\.\d{2})?)/i,
  ];
  for (const p of limitPatterns) {
    const m = t.match(p);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n > 0) {
        totalLimit = n;
        break;
      }
    }
  }

  // Fallback: sum amounts in a "Revolving" or "Credit card" section (first block after that heading)
  if (totalBalance == null || totalLimit == null) {
    const revolvingSection = t.match(/(?:revolving|credit\s*card|revolving\s+account)[\s\S]{0,2000}?(?=(?:negative|collection|derogatory|public\s+record|inquir)|$)/i);
    if (revolvingSection) {
      const section = revolvingSection[0];
      const amounts = parseDollarAmounts(section);
      if (amounts.length >= 2) {
        const small = Math.min(...amounts);
        const large = Math.max(...amounts);
        if (totalBalance == null && totalLimit == null) {
          totalBalance = small;
          totalLimit = large;
        } else if (totalBalance == null) totalBalance = amounts[0];
        else if (totalLimit == null) totalLimit = amounts[0];
      }
    }
  }

  let utilizationPct: number | null = null;
  if (totalBalance != null && totalLimit != null && totalLimit > 0) {
    const pct = (totalBalance / totalLimit) * 100;
    utilizationPct = Math.round(pct * 100) / 100;
  }

  return { totalRevolvingBalance: totalBalance, totalRevolvingLimit: totalLimit, utilizationPct };
}

/** Extract numeric value after a label (e.g. "Total Accounts: 15" or "Total Accounts 15") */
function parseLabelNumber(text: string, label: string): number | null {
  const patterns = [
    new RegExp(`${label}\\s*[:\\s]+(\\d+)`, "i"),
    new RegExp(`${label}[^\\d]*(\\d+)`, "i"),
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  }
  return null;
}

/** Extract dollar amount after a label */
function parseLabelAmount(text: string, label: string): number | null {
  const p = new RegExp(`${label}\\s*[:\\s]*\\$?\\s*([\\d,]+(?:\\.\\d{2})?)`, "i");
  const m = text.match(p);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Parse the Summary section from MyFreeScoreNow (after personal information).
 * Returns: Total Accounts, Open Accounts, Closed Accounts, Delinquent, Balances, Payments, Public Records, Inquiries (2 years).
 */
export function parseSummaryFromReport(text: string): {
  totalAccounts: number | null;
  openAccounts: number | null;
  closedAccounts: number | null;
  delinquent: number | null;
  balances: number | null;
  payments: string | null;
  publicRecords: number | null;
  inquiries2Years: number | null;
} {
  const t = text.trim();
  if (!t || t.length < 50) {
    return {
      totalAccounts: null,
      openAccounts: null,
      closedAccounts: null,
      delinquent: null,
      balances: null,
      payments: null,
      publicRecords: null,
      inquiries2Years: null,
    };
  }

  const totalAccounts = parseLabelNumber(t, "Total Accounts") ?? parseLabelNumber(t, "Total accounts");
  const openAccounts = parseLabelNumber(t, "Open Accounts") ?? parseLabelNumber(t, "Open accounts");
  const closedAccounts = parseLabelNumber(t, "Closed Accounts") ?? parseLabelNumber(t, "Closed accounts");
  const delinquent = parseLabelNumber(t, "Delinquent") ?? parseLabelNumber(t, "Delinquent accounts");
  const balances = parseLabelAmount(t, "Balances") ?? parseLabelAmount(t, "Balance") ?? parseLabelAmount(t, "Total balance");
  const publicRecords = parseLabelNumber(t, "Public Records") ?? parseLabelNumber(t, "Public records");
  const hardFromSummary = parseHardInquiryCountFromReport(t);
  const inquiries2Years =
    hardFromSummary.displayMax ??
    parseLabelNumber(t, "Inquiries \\(2 years\\)") ??
    parseLabelNumber(t, "Inquiries \\(2 year") ??
    parseLabelNumber(t, "Inquiries 2 years") ??
    null;

  let payments: string | null = null;
  const paymentsMatch = t.match(/(?:Payments?|Payment history)\s*[:\s]*([^\n\r]+?)(?=\n|$)/i);
  if (paymentsMatch) payments = paymentsMatch[1].trim().slice(0, 80);

  return {
    totalAccounts,
    openAccounts,
    closedAccounts,
    delinquent,
    balances,
    payments,
    publicRecords,
    inquiries2Years,
  };
}
