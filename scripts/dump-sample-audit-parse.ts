/**
 * One-off: run parsers on maria_lanham_credit_report.pdf for verification.
 * Usage: npx tsx scripts/dump-sample-audit-parse.ts [path/to/report.pdf]
 */
import fs from "fs";
import path from "path";
import {
  parseScoresFromReport,
  parseNegativeItemsFromReport,
  parseHardInquiryCountFromReport,
  parseSummaryFromReport,
} from "../src/lib/myfreescorenow-parser";
import { analyzeCreditReport } from "../src/lib/credit-audit";

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

  const scores = parseScoresFromReport(rawText);
  const inq = parseHardInquiryCountFromReport(rawText);
  const summary = parseSummaryFromReport(rawText);
  const negatives = parseNegativeItemsFromReport(rawText);
  const analysis = analyzeCreditReport({
    fileName: path.basename(pdfPath),
    type: "pdf",
    clientName: "Sample client",
    rawText,
  });

  console.log("=== Extracted text length:", rawText.length, "chars ===\n");

  console.log("--- Scores (parseScoresFromReport) ---");
  console.log(JSON.stringify(scores, null, 2));
  console.log("\n--- Audit scoreSnapshot string ---");
  console.log(analysis.scoreSnapshot ?? "(none)");

  console.log("\n--- Inquiry parsing ---");
  console.log(JSON.stringify(inq, null, 2));
  console.log("hardInquiriesCount (audit / funding):", analysis.hardInquiriesCount);
  console.log("reportSummary.inquiries2Years:", summary.inquiries2Years);

  console.log("\n--- Summary section (parser) ---");
  console.log(JSON.stringify(summary, null, 2));

  console.log("\n--- Negative items:", negatives.length, "---");
  for (const n of negatives) {
    console.log(
      `- ${n.accountName} | ${n.bureau} | type: ${n.accountType ?? "—"} | balance: ${n.balance ?? "—"} | reason: ${n.negativeReason ?? "—"}`
    );
  }

  console.log("\n--- Audit analysis counts ---");
  console.log(
    JSON.stringify(
      {
        negativeItemsInAnalysis: analysis.negativeItems.length,
        collectionsCount: analysis.collectionsCount,
        chargeOffsCount: analysis.chargeOffsCount,
        hardInquiriesCount: analysis.hardInquiriesCount,
        utilizationPct: analysis.utilizationPct,
        summaryIssues: analysis.summaryIssues,
        latePaymentMatrix: analysis.latePaymentMatrix,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
