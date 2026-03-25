/**
 * Generate a sample Credit Report Analysis PDF to preview the layout locally.
 * Run: npm run preview-audit
 * Output: preview-audit.pdf in the project root (open in a PDF viewer).
 */
import path from "path";
import fs from "fs";
import { generateAuditPdfBuffer } from "../src/lib/audit-pdf";

async function main() {
  const outPath = path.join(process.cwd(), "preview-audit.pdf");

  const buffer = await generateAuditPdfBuffer({
    clientName: "Sample Client",
    auditDate: new Date(),
    scoreSnapshot: "Experian: 720, Equifax: 715, TransUnion: 718",
    negativeCount: 3,
    collectionsCount: 1,
    chargeOffsCount: 0,
    hardInquiriesCount: 2,
    utilizationPct: 18,
    summaryIssues: "Sample summary for preview.",
    recommendedSteps: "Sample next steps for preview.",
    capitalReadinessNotes: "Sample notes for preview.",
    reportSummary: {
      totalAccounts: 15,
      openAccounts: 10,
      closedAccounts: 5,
      delinquent: 2,
      balances: 12450.5,
      payments: "On time",
      publicRecords: 0,
      inquiries2Years: 3,
    },
    negativeItems: [
      { accountName: "Sample Collection Account", bureau: "Experian", accountType: "Collection", balance: 500, negativeReason: "Collection" },
      { accountName: "Another Creditor - 1234****", bureau: "Equifax", accountType: "ACCOUNTS", balance: null, negativeReason: "Late 30" },
      { accountName: "Medical Collection Co", bureau: "TransUnion", accountType: "Collection", balance: 1200, negativeReason: "Collection" },
    ],
    factorsAffecting: {
      equifax: ["You have too many delinquent or derogatory accounts (sample)."],
      experian: ["Lack of sufficient credit history on bankcard or revolving accounts (sample)."],
      transUnion: ["You have too many inquiries on your credit report (sample)."],
    },
    latePaymentMatrix: {
      rows: [
        {
          accountName: "Capital One Auto Fin",
          cell30: "EX:6",
          cell60: "EX:3",
          cell90: "EX:2",
          cell120: "—",
          rowTotal: 11,
        },
        {
          accountName: "Thd / Cbna",
          cell30: "TU:2",
          cell60: "TU:1",
          cell90: "TU:1",
          cell120: "—",
          rowTotal: 4,
        },
      ],
      grandTotal: 15,
    },
  });

  fs.writeFileSync(outPath, buffer);
  console.log("Preview PDF written to:", outPath);
  console.log("Open it in your PDF viewer to see how the audit report looks before deploying.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
