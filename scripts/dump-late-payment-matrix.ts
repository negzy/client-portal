/**
 * Run late-payment parser on a PDF and print a verification matrix.
 * Usage: npx tsx scripts/dump-late-payment-matrix.ts [path/to/report.pdf]
 */
import fs from "fs";
import path from "path";
import { parseTradelinePastDueNegatives } from "../src/lib/myfreescorenow-parser";

type Sev = "Late 30" | "Late 60" | "Late 90" | "Late 120";
const SEVS: Sev[] = ["Late 30", "Late 60", "Late 90", "Late 120"];
const BUREAUS = ["Equifax", "Experian", "TransUnion"] as const;

function parseCount(reason: string | undefined): number {
  if (!reason) return 1;
  const m = reason.match(/report count:\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : 1;
}

async function main() {
  const pdfPath = path.resolve(process.argv[2] ?? "./maria_lanham_credit_report.pdf");
  if (!fs.existsSync(pdfPath)) {
    console.error("File not found:", pdfPath);
    process.exit(1);
  }

  const buf = fs.readFileSync(pdfPath);
  const { getDocumentProxy, extractText } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  const rawText = typeof text === "string" ? text : "";
  const items = parseTradelinePastDueNegatives(rawText);

  const byAccount = new Map<string, Map<Sev, Map<string, number>>>();

  for (const it of items) {
    const sev = it.accountType as Sev;
    if (!SEVS.includes(sev)) continue;
    const bu = it.bureau;
    const n = parseCount(it.negativeReason ?? undefined);
    if (!byAccount.has(it.accountName)) {
      const m = new Map<Sev, Map<string, number>>();
      for (const s of SEVS) m.set(s, new Map());
      byAccount.set(it.accountName, m);
    }
    const am = byAccount.get(it.accountName)!;
    const sm = am.get(sev)!;
    sm.set(bu, Math.max(sm.get(bu) ?? 0, n));
  }

  const accounts = Array.from(byAccount.keys()).sort((a, b) => a.localeCompare(b));

  console.log("PDF:", path.basename(pdfPath));
  console.log("Extracted chars:", rawText.length);
  console.log("Structured late-payment rows (parser):", items.length);
  console.log("Unique accounts with any late bucket:", accounts.length);
  console.log("");

  const colWidth = 14;
  function cell(sev: Sev, bureauMap: Map<string, number>): string {
    const parts: string[] = [];
    for (const b of BUREAUS) {
      const n = bureauMap.get(b) ?? 0;
      if (n > 0) parts.push(`${b.slice(0, 2)}:${n}`);
    }
    const s = parts.join(" ") || "—";
    return s.length > colWidth ? s.slice(0, colWidth - 1) + "…" : s.padEnd(colWidth);
  }

  const hdr =
    "Account".padEnd(36) +
    "30 d".padEnd(colWidth) +
    "60 d".padEnd(colWidth) +
    "90 d".padEnd(colWidth) +
    "120 d".padEnd(colWidth) +
    "Row Σ";
  console.log(hdr);
  console.log("-".repeat(hdr.length));

  let grand = 0;
  for (const acc of accounts) {
    const am = byAccount.get(acc)!;
    let rowSum = 0;
    const cells: string[] = [];
    for (const sev of SEVS) {
      const bm = am.get(sev)!;
      for (const b of BUREAUS) rowSum += bm.get(b) ?? 0;
      cells.push(cell(sev, bm));
    }
    grand += rowSum;
    const shortAcc = acc.length > 35 ? acc.slice(0, 32) + "…" : acc;
    console.log(shortAcc.padEnd(36) + cells.join("") + String(rowSum));
  }
  console.log("-".repeat(hdr.length));
  console.log(
    "Total (sum of report counts across all bureau × severity cells):",
    grand
  );
  console.log("");
  console.log("--- Raw parser lines (account | bureau | type | detail) ---");
  for (const it of items) {
    console.log(
      `${it.accountName} | ${it.bureau} | ${it.accountType} | ${it.negativeReason ?? ""}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
