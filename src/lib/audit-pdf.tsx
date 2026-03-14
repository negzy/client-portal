import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { isBlobStorageAvailable, uploadToBlob } from "@/lib/blob";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  // Cover page
  coverTitle: {
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 8,
  },
  coverClientName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 14,
  },
  coverSub: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.4,
    marginBottom: 20,
  },
  coverCreated: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 24,
  },
  coverPreparedBy: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 4,
  },
  coverBrand: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  coverUrl: {
    fontSize: 10,
    color: "#0ea5e9",
  },
  pageFooter: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
  pageNum: {
    position: "absolute",
    bottom: 28,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
  },
  eduTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
  },
  eduBody: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.45,
    marginBottom: 8,
  },
  eduBox: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 4,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  // Data page
  dataPageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  dataPageClient: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  dataPageSub: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 16,
  },
  bureauCol: {
    flex: 1,
    marginRight: 8,
  },
  bureauColLast: {
    flex: 1,
  },
  bureauHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  bureauScore: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  bureauRow: {
    flexDirection: "row",
    marginBottom: 3,
    fontSize: 9,
  },
  bureauLabel: {
    color: "#64748b",
    width: "70%",
  },
  bureauValue: {
    color: "#1e293b",
    width: "30%",
  },
  threeColRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 14,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.35,
    marginBottom: 8,
  },
  usageBox: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 12,
    fontSize: 9,
    color: "#334155",
  },
  // Derogatory table (ref: Account Name | Dispute Type | Equifax | Experian | TransUnion | Details)
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 8,
    fontWeight: "bold",
    color: "#475569",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    fontSize: 8,
    color: "#334155",
  },
  colAccount: { width: "24%" },
  colDisputeType: { width: "14%" },
  colEq: { width: "12%", textAlign: "center" },
  colEx: { width: "12%", textAlign: "center" },
  colTu: { width: "12%", textAlign: "center" },
  colDetails: { width: "26%", fontSize: 7 },
});

export type AuditNegativeItem = {
  accountName: string;
  bureau: string;
  accountType?: string | null;
  balance?: number | null;
  negativeReason?: string | null;
};

type AuditPdfProps = {
  clientName: string;
  auditDate: Date;
  scoreSnapshot: string | null;
  negativeCount: number;
  collectionsCount: number;
  chargeOffsCount: number;
  hardInquiriesCount: number;
  utilizationPct: number | null;
  summaryIssues: string;
  recommendedSteps: string;
  capitalReadinessNotes: string;
  negativeItems?: AuditNegativeItem[];
};

function formatCreatedDate(d: Date) {
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  return `${months[d.getMonth()]} ${day}${suffix}, ${d.getFullYear()}`;
}

function AuditDocument(props: AuditPdfProps) {
  const items = props.negativeItems ?? [];
  const createdStr = formatCreatedDate(props.auditDate);
  const reportDateStr = props.auditDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, "/");

  // Parse scores into Experian, Equifax, TransUnion order
  const scoreParts = props.scoreSnapshot ? props.scoreSnapshot.split(",").map((s) => s.trim()) : [];
  const getScore = (bureau: "Experian" | "Equifax" | "TransUnion") => {
    const key = bureau === "Experian" ? "EX" : bureau === "Equifax" ? "EQ" : "TU";
    for (const part of scoreParts) {
      const m = part.match(new RegExp(`^(?:${key}|${bureau})\\s*[:\\s]*(\\d{3})$`, "i"));
      if (m) return m[1];
    }
    return "—";
  };
  const experianScore = getScore("Experian");
  const equifaxScore = getScore("Equifax");
  const transUnionScore = getScore("TransUnion");

  const bureauStats = (score: string, label: string, isLast?: boolean) => (
    <View style={isLast ? styles.bureauColLast : styles.bureauCol}>
      <Text style={styles.bureauHeader}>{label}</Text>
      <Text style={styles.bureauScore}>{score}</Text>
      <Text style={[styles.bureauRow, styles.bureauValue]}>{reportDateStr}</Text>
      <View style={styles.bureauRow}>
        <Text style={styles.bureauLabel}>Accounts</Text>
        <Text style={styles.bureauValue}>—</Text>
      </View>
      <View style={styles.bureauRow}>
        <Text style={styles.bureauLabel}>Inquiries</Text>
        <Text style={styles.bureauValue}>{props.hardInquiriesCount}</Text>
      </View>
      <View style={styles.bureauRow}>
        <Text style={styles.bureauLabel}>Public Records</Text>
        <Text style={styles.bureauValue}>0</Text>
      </View>
      <View style={styles.bureauRow}>
        <Text style={styles.bureauLabel}>Collections</Text>
        <Text style={styles.bureauValue}>{props.collectionsCount}</Text>
      </View>
      <View style={styles.bureauRow}>
        <Text style={styles.bureauLabel}>Current Past Due</Text>
        <Text style={styles.bureauValue}>0</Text>
      </View>
      <View style={styles.bureauRow}>
        <Text style={styles.bureauLabel}>Prior Past Due</Text>
        <Text style={styles.bureauValue}>0</Text>
      </View>
      <View style={styles.bureauRow}>
        <Text style={styles.bureauLabel}>Positive</Text>
        <Text style={styles.bureauValue}>—</Text>
      </View>
      <View style={styles.bureauRow}>
        <Text style={styles.bureauLabel}>Negative</Text>
        <Text style={styles.bureauValue}>{props.negativeCount}</Text>
      </View>
    </View>
  );

  const showNegInBureau = (item: AuditNegativeItem, bureau: string) => {
    const b = bureau.toLowerCase();
    const itemB = item.bureau.toLowerCase();
    if (itemB.includes("experian") && b === "experian") return "Negative";
    if (itemB.includes("equifax") && b === "equifax") return "Negative";
    if (itemB.includes("transunion") && b === "transunion") return "Negative";
    return "—";
  };

  const totalPages = 9;

  return (
    <Document>
      {/* Page 1: Cover */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverTitle}>Credit Analysis For</Text>
        <Text style={styles.coverClientName}>{props.clientName.toUpperCase()}</Text>
        <Text style={styles.coverSub}>
          This analysis report was generated by The Credit Hub and shows the positive and negative items from all three Credit Bureaus
        </Text>
        <Text style={styles.coverCreated}>Created: {createdStr}</Text>
        <Text style={styles.coverPreparedBy}>Prepared by</Text>
        <Text style={styles.coverBrand}>The Credit Hub</Text>
        <Text style={styles.coverUrl}>www.thecredithub.io</Text>
        <Text style={[styles.pageFooter, { marginTop: 0 }]}>Visit Us Online at: www.thecredithub.io</Text>
        <Text style={styles.pageNum}>1 of {totalPages}</Text>
      </Page>

      {/* Page 2: A Low Score Can Cost You */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.eduTitle}>A Low Score Can Cost You</Text>
        <Text style={styles.eduBody}>
          Having a great credit score is key to the rest of your financial life. It can mean the difference between home ownership and renting for the rest of your life. You will struggle to get approved for Credit Cards, Car Loans, and Mortgages — or pay tens of thousands more in interest.
        </Text>
        <Text style={styles.eduTitle}>Real World Auto Loan Example</Text>
        <Text style={styles.eduBody}>
          In this example, having a 710 vs a 524 would save you almost $10,000 on the life of the loan. Having a high score will save you many thousands of dollars on some of the most important purchases of your life.
        </Text>
        <Text style={styles.pageFooter}>Visit Us Online at: www.thecredithub.io</Text>
        <Text style={styles.pageNum}>2 of {totalPages}</Text>
      </Page>

      {/* Page 3: Considering Home Ownership */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.eduTitle}>Considering Home Ownership?</Text>
        <Text style={styles.eduBody}>
          This will be the single largest purchase most of us will ever make in our lifetimes — make sure you have a score well above 650 to take advantage of better interest rates.
        </Text>
        <Text style={styles.eduTitle}>Real World Home Loan Example</Text>
        <Text style={styles.eduBody}>
          In this example, having a 710 vs a 524 would save you over $140,000 on the life of the loan. The sooner you start improving your credit, the sooner we can get you results!
        </Text>
        <Text style={styles.pageFooter}>Visit Us Online at: www.thecredithub.io</Text>
        <Text style={styles.pageNum}>3 of {totalPages}</Text>
      </Page>

      {/* Page 4: Understanding Credit Scores */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.eduTitle}>Understanding Credit Scores</Text>
        <Text style={styles.eduBody}>
          There are a lot of factors that go into your credit score. Your score will also vary depending on which Credit Bureau the lender decides to use. Credit scores range from 300-850. The higher your score, the more likely you will be approved for loans at better rates.
        </Text>
        <Text style={styles.eduTitle}>Score Factors</Text>
        <Text style={styles.eduBody}>35% Payment History · 30% Amount Owed · 15% Credit History · 10% Types of Credit · 10% Applying for Credit</Text>
        <Text style={styles.pageFooter}>Visit Us Online at: www.thecredithub.io</Text>
        <Text style={styles.pageNum}>4 of {totalPages}</Text>
      </Page>

      {/* Page 5: Credit Analysis for [Name] - three bureaus + credit card usage */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.dataPageTitle}>Credit Analysis for</Text>
        <Text style={styles.dataPageClient}>{props.clientName}</Text>
        <Text style={styles.dataPageSub}>Shows the positive and negative items from all three Credit Bureaus</Text>

        <View style={styles.threeColRow}>
          {bureauStats(experianScore, "Experian")}
          {bureauStats(equifaxScore, "Equifax")}
          {bureauStats(transUnionScore, "TransUnion", true)}
        </View>

        <Text style={styles.sectionTitle}>- Credit Card Usage -</Text>
        <Text style={styles.sectionText}>
          If you're carrying high balances, try to pay your balances down to below 25% of the available credit limit of each card. Never spend more than that, even if you pay the bill off in full each month.
        </Text>
        <View style={styles.usageBox}>
          <Text>Avg Usage {props.utilizationPct != null ? `${props.utilizationPct}%` : "—"}</Text>
        </View>

        <Text style={styles.pageFooter}>Visit Us Online at: www.thecredithub.io</Text>
        <Text style={styles.pageNum}>5 of {totalPages}</Text>
      </Page>

      {/* Page 6: Your Derogatory Items */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>- Your Derogatory Items -</Text>
        <Text style={styles.sectionText}>
          You have {items.length} item(s) marked as delinquent or derogatory (negative). Late payments, Collections, and other derogatory items within the last 6 months will hurt your credit score more so than older in-active accounts.
        </Text>
        {items.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colAccount}>Account Name</Text>
              <Text style={styles.colDisputeType}>Dispute Type</Text>
              <Text style={styles.colEq}>Equifax</Text>
              <Text style={styles.colEx}>Experian</Text>
              <Text style={styles.colTu}>TransUnion</Text>
              <Text style={styles.colDetails}>Details</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colAccount}>{item.accountName}</Text>
                <Text style={styles.colDisputeType}>{item.accountType ?? "ACCOUNTS"}</Text>
                <Text style={styles.colEq}>{showNegInBureau(item, "Equifax")}</Text>
                <Text style={styles.colEx}>{showNegInBureau(item, "Experian")}</Text>
                <Text style={styles.colTu}>{showNegInBureau(item, "TransUnion")}</Text>
                <Text style={styles.colDetails}>
                  {item.negativeReason ?? (item.balance != null ? `Balance $${Number(item.balance).toLocaleString()}` : "—")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.pageFooter}>Visit Us Online at: www.thecredithub.io</Text>
        <Text style={styles.pageNum}>6 of {totalPages}</Text>
      </Page>

      {/* Page 7: Public Records & Inquiries */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>- Your Public Records -</Text>
        <Text style={styles.sectionText}>
          You have 0 on your report. Public records include details of any Court Records, Bankruptcy filings, Judgements & Tax Liens. These can remain on your Credit Report for up to 7-10 years.
        </Text>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>- Your Credit Inquiries -</Text>
        <Text style={styles.sectionText}>
          You have {props.hardInquiriesCount} Inquiries on your report. Every time you apply for credit, it lowers your score. For this reason we ask that during the credit repair process, you do not apply for any new credit.
        </Text>

        <Text style={styles.pageFooter}>Visit Us Online at: www.thecredithub.io</Text>
        <Text style={styles.pageNum}>7 of {totalPages}</Text>
      </Page>

      {/* Page 8: How Long / Law / Your Next Steps */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.eduTitle}>How Long to See Results?</Text>
        <Text style={styles.eduBody}>
          Credit line balances are reported to the bureaus once a month. It can take 1-2 months to start seeing score improvements. This will be one of the most rewarding financial decisions you will make. The sooner you start, the sooner we can get you results!
        </Text>
        <Text style={styles.eduTitle}>The Law is on Your Side</Text>
        <Text style={styles.eduBody}>
          Nearly 80% of all credit reports have errors that can lower your scores — but you have legal rights and we know how to use them to benefit you! The law gives you the right to dispute any item on your credit report. If those items can't be verified, they have to be removed. We Will Fight for YOU!
        </Text>
        <Text style={styles.sectionTitle}>Your Next Steps:</Text>
        <Text style={styles.sectionText}>
          Log Into Your Client Portal — You will receive an email with your unique login and password and instructions on how to get started.
        </Text>
        <Text style={styles.sectionText}>
          Upload Your Documents — Take a picture of these on your phone and upload them to us in your client portal: Copy of your Photo ID, Copy of a Utility Bill, Photo of your SSN Card.
        </Text>
        <Text style={styles.sectionText}>
          Sit Back & Relax — Once we have all your documentation, we will start the disputing process and send letters to all the credit bureaus and creditors to get incorrect and negative items removed!
        </Text>

        <Text style={styles.pageFooter}>Visit Us Online at: www.thecredithub.io</Text>
        <Text style={styles.pageNum}>8 of {totalPages}</Text>
      </Page>

      {/* Page 9: Let's Get Started */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.eduTitle}>Let's Get Started!</Text>
        <Text style={styles.eduBody}>
          If you have any questions, or are ready to get started on your journey to great credit, then please contact us on our website or with the information below.
        </Text>
        <Text style={[styles.coverBrand, { marginTop: 20 }]}>The Credit Hub</Text>
        <Text style={styles.coverUrl}>www.thecredithub.io</Text>

        <Text style={styles.pageFooter}>Visit Us Online at: www.thecredithub.io</Text>
        <Text style={styles.pageNum}>9 of {totalPages}</Text>
      </Page>
    </Document>
  );
}

export async function generateAuditPdf(
  props: AuditPdfProps
): Promise<string | null> {
  try {
    const blob = await pdf(
      <AuditDocument
        clientName={props.clientName}
        auditDate={props.auditDate}
        scoreSnapshot={props.scoreSnapshot}
        negativeCount={props.negativeCount}
        collectionsCount={props.collectionsCount}
        chargeOffsCount={props.chargeOffsCount}
        hardInquiriesCount={props.hardInquiriesCount}
        utilizationPct={props.utilizationPct}
        summaryIssues={props.summaryIssues}
        recommendedSteps={props.recommendedSteps}
        capitalReadinessNotes={props.capitalReadinessNotes}
        negativeItems={props.negativeItems}
      />
    ).toBlob();

    const buffer = Buffer.from(await blob.arrayBuffer());

    if (isBlobStorageAvailable()) {
      const blobUrl = await uploadToBlob(
        buffer,
        `audits/audit-${Date.now()}.pdf`,
        { contentType: "application/pdf" }
      );
      return blobUrl;
    }

    const dir = path.join(process.cwd(), "uploads", "audits");
    await mkdir(dir, { recursive: true });
    const fileName = `audit-${Date.now()}.pdf`;
    const filePath = path.join(dir, fileName);
    await writeFile(filePath, buffer);
    return path.relative(process.cwd(), filePath);
  } catch (e) {
    console.error("PDF generation failed:", e);
    return null;
  }
}
