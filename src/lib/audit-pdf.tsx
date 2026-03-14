import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";
import path from "path";
import fs from "fs";
import { writeFile, mkdir } from "fs/promises";
import { isBlobStorageAvailable, uploadToBlob } from "@/lib/blob";

const BRAND = {
  name: "The Credit Hub",
  url: "www.thecredithub.io",
};

// Table column widths (points)
const COL_ACCOUNT = 130;
const COL_TYPE = 58;
const COL_BUREAU = 42;
const COL_DETAILS = 160;

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  // Cover (Page 1) – centered, clean
  coverLogo: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0ea5e9",
    marginBottom: 24,
    textAlign: "center",
  },
  logoImage: {
    width: 140,
    height: 44,
    marginBottom: 20,
    alignSelf: "center",
  },
  coverImage: {
    width: "100%",
    maxWidth: 520,
    height: 320,
    alignSelf: "center",
    marginBottom: 24,
  },
  envelopeIconImage: {
    width: 48,
    height: 48,
    marginBottom: 12,
    alignSelf: "center",
  },
  coverTitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    textAlign: "center",
  },
  coverClientName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  coverSub: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.5,
    marginBottom: 10,
    textAlign: "center",
  },
  coverCreated: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 16,
    textAlign: "center",
  },
  coverCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  coverScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  coverScoreBlock: {
    alignItems: "center",
    width: "30%",
  },
  coverScoreValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  coverScoreLabel: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  miniTableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 8,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  miniTableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8,
    color: "#334155",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  coverPrepared: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 20,
    marginBottom: 2,
    textAlign: "center",
  },
  coverBrand: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
    textAlign: "center",
  },
  coverUrl: {
    fontSize: 9,
    color: "#0ea5e9",
    textAlign: "center",
  },
  // Footer (all pages)
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
  },
  footerLink: {
    color: "#0ea5e9",
  },
  pageNum: {
    position: "absolute",
    bottom: 20,
    right: 36,
    fontSize: 8,
    color: "#94a3b8",
  },
  summaryBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontSize: 10,
  },
  summaryLabel: { color: "#64748b" },
  summaryValue: { color: "#0f172a", fontWeight: "bold" },
  // Page 2 – Understanding Credit Scores
  eduTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  eduSub: {
    fontSize: 10,
    color: "#64748b",
    lineHeight: 1.5,
    marginBottom: 14,
    textAlign: "center",
  },
  eduBox: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#1e40af",
  },
  eduBoxTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 6,
  },
  eduBullet: {
    flexDirection: "row",
    marginBottom: 4,
    fontSize: 9,
    color: "#334155",
  },
  eduCheck: {
    marginRight: 6,
    color: "#1e40af",
  },
  bureauSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 14,
    marginBottom: 8,
  },
  bureauLogosRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  bureauLogoText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#475569",
  },
  scoreFactorsRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  scoreFactorsList: {
    flex: 1,
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.8,
  },
  // Page 3 – Bureau cards + Usage
  dataPageTitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
    textAlign: "center",
  },
  dataPageClient: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
    textAlign: "center",
  },
  dataPageSub: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 14,
    textAlign: "center",
    lineHeight: 1.5,
  },
  threeColRow: {
    flexDirection: "row",
    marginBottom: 14,
    gap: 10,
  },
  bureauCol: {
    flex: 1,
    minWidth: 0,
  },
  bureauCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10,
  },
  bureauCardHeader: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  bureauCardHeaderEq: { color: "#dc2626" },
  bureauCardHeaderEx: { color: "#7c3aed" },
  bureauCardHeaderTu: { color: "#2563eb" },
  bureauScore: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 2,
  },
  bureauDate: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 8,
  },
  bureauStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    marginBottom: 2,
  },
  bureauStatLabel: { color: "#64748b" },
  bureauStatValue: { color: "#0f172a" },
  bureauPositiveNegative: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    fontSize: 8,
  },
  usageSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 14,
    marginBottom: 6,
    textAlign: "center",
  },
  usageIntro: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.5,
    marginBottom: 8,
    textAlign: "center",
  },
  usageBox: {
    backgroundColor: "#f0fdf4",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  usageLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 2,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#15803d",
  },
  usageScale: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  usageScaleSegment: {
    flex: 1,
    paddingVertical: 4,
    alignItems: "center",
  },
  usageScaleLabel: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 2,
  },
  // Page 4 – Derogatory
  derogTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 6,
    textAlign: "center",
  },
  derogSub: {
    fontSize: 10,
    color: "#0f172a",
    marginBottom: 4,
    textAlign: "center",
  },
  derogSubBold: { fontWeight: "bold", color: "#dc2626" },
  derogDesc: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.4,
    marginBottom: 12,
    textAlign: "center",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 9,
    fontWeight: "bold",
    color: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 9,
    color: "#334155",
  },
  colAccount: { width: COL_ACCOUNT, paddingRight: 4 },
  colType: { width: COL_TYPE, paddingRight: 4 },
  colEq: { width: COL_BUREAU, textAlign: "center", paddingRight: 2 },
  colEx: { width: COL_BUREAU, textAlign: "center", paddingRight: 2 },
  colTu: { width: COL_BUREAU, textAlign: "center", paddingRight: 2 },
  colDetails: { width: COL_DETAILS, fontSize: 8 },
  negText: { color: "#dc2626", fontSize: 8 },
  noneText: { color: "#0ea5e9", fontSize: 8 },
  // Page 5 – Let's Get Started
  ctaIcon: {
    fontSize: 32,
    textAlign: "center",
    marginBottom: 12,
    color: "#1e40af",
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
    textAlign: "center",
  },
  ctaBody: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.5,
    marginBottom: 24,
    textAlign: "center",
  },
  ctaBrandBox: {
    backgroundColor: "#f1f5f9",
    padding: 20,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 20,
  },
  ctaBrand: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },
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
  totalRevolvingBalance?: number | null;
  totalRevolvingLimit?: number | null;
  reportSummary?: {
    totalAccounts: number | null;
    openAccounts: number | null;
    closedAccounts: number | null;
    delinquent: number | null;
    balances: number | null;
    payments: string | null;
    publicRecords: number | null;
    inquiries2Years: number | null;
  };
  summaryIssues: string;
  recommendedSteps: string;
  capitalReadinessNotes: string;
  negativeItems?: AuditNegativeItem[];
  /** Optional absolute path to cover image (e.g. public/audit-assets/auditsccc.png) for page 1 */
  coverImagePath?: string;
  /** Optional absolute path to logo image (e.g. public/audit-assets/logo.png) for cover and CTA */
  logoPath?: string;
  /** Optional absolute path to envelope icon (e.g. public/audit-assets/icon-envelope.png) for Let's Get Started page */
  envelopeIconPath?: string;
};

function formatCreatedDate(d: Date) {
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  const day = d.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
          ? "rd"
          : "th";
  return `${months[d.getMonth()]} ${day}${suffix}, ${d.getFullYear()}`;
}

function AuditDocument(props: AuditPdfProps) {
  const items = props.negativeItems ?? [];
  const createdStr = formatCreatedDate(props.auditDate);
  const reportDateStr = props.auditDate
    .toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    .replace(/\//g, "/");

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

  const eqCount = items.filter((i) => i.bureau.toLowerCase().includes("equifax")).length;
  const exCount = items.filter((i) => i.bureau.toLowerCase().includes("experian")).length;
  const tuCount = items.filter((i) => i.bureau.toLowerCase().includes("transunion")).length;

  const showNegInBureau = (item: AuditNegativeItem, bureau: string) => {
    const b = bureau.toLowerCase();
    const itemB = item.bureau.toLowerCase();
    if (itemB.includes("experian") && b === "experian") return true;
    if (itemB.includes("equifax") && b === "equifax") return true;
    if (itemB.includes("transunion") && b === "transunion") return true;
    return false;
  };

  const totalPages = 5;

  const Footer = ({ page }: { page: number }) => (
    <>
      <Text style={styles.footer}>
        Visit Us Online at: <Text style={styles.footerLink}>{BRAND.url}</Text>
      </Text>
      <Text style={styles.pageNum}>
        {page} of {totalPages}
      </Text>
    </>
  );

  return (
    <Document>
      {/* Page 1: Cover – image + Credit Analysis for [Name] only (no scores, no dispute table) */}
      <Page size="A4" style={styles.page}>
        {props.coverImagePath ? (
          <Image src={props.coverImagePath} style={styles.coverImage} />
        ) : null}
        <Text style={styles.coverTitle}>Credit Analysis for</Text>
        <Text style={styles.coverClientName}>{props.clientName}</Text>
        <Footer page={1} />
      </Page>

      {/* Page 2: Understanding Credit Scores */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.eduTitle}>Understanding Credit Scores</Text>
        <Text style={styles.eduSub}>
          There are a lot of factors that go into your credit score. Your score will also vary depending on which Credit Bureau the lender decides to use for your application. Understanding how it all works will empower you to build and maintain a great score going forward.
        </Text>

        <View style={styles.eduBox}>
          <Text style={styles.eduBoxTitle}>Credit Scores</Text>
          <View style={styles.eduBullet}>
            <Text style={styles.eduCheck}>✓</Text>
            <Text>A credit score is a number generated using a formula that is meant to predict your credit worthiness.</Text>
          </View>
          <View style={styles.eduBullet}>
            <Text style={styles.eduCheck}>✓</Text>
            <Text>Credit scores range from 300-850. The higher your score is, the more likely you will be approved for loans.</Text>
          </View>
          <View style={styles.eduBullet}>
            <Text style={styles.eduCheck}>✓</Text>
            <Text>The lower your score, the less likely you will be approved.</Text>
          </View>
          <View style={styles.eduBullet}>
            <Text style={styles.eduCheck}>✓</Text>
            <Text>Your interest rates will be MUCH higher than someone who has a great credit score.</Text>
          </View>
          <View style={styles.eduBullet}>
            <Text style={styles.eduCheck}>✓</Text>
            <Text>Having a high score will save you many thousands of dollars on some of the most important purchases of your life.</Text>
          </View>
        </View>

        <Text style={styles.bureauSectionTitle}>Credit Bureaus</Text>
        <Text style={[styles.eduSub, { textAlign: "left", marginBottom: 8 }]}>
          Credit Bureaus are companies that collect and maintain your credit information which Lenders and Creditors use to determine whether or not you will be approved.
        </Text>
        <View style={styles.bureauLogosRow}>
          <Text style={[styles.bureauLogoText, { color: "#1e40af" }]}>experian</Text>
          <Text style={[styles.bureauLogoText, { color: "#dc2626" }]}>EQUIFAX®</Text>
          <Text style={[styles.bureauLogoText, { color: "#2563eb" }]}>TransUnion</Text>
        </View>
        <View style={styles.eduBox}>
          <Text style={styles.eduBoxTitle}>Score Factors</Text>
          <Text style={styles.scoreFactorsList}>
            35% Payment History{"\n"}30% Amount Owed{"\n"}15% Credit History{"\n"}10% Types of Credit{"\n"}10% Applying for Credit
          </Text>
        </View>

        <Footer page={2} />
      </Page>

      {/* Page 3: Credit Bureau Scores + Credit Card Usage */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.dataPageTitle}>Credit Analysis for</Text>
        <Text style={styles.dataPageClient}>{props.clientName}</Text>
        <Text style={styles.dataPageSub}>Shows the positive and negative items from all three Credit Bureaus</Text>

        <View style={styles.threeColRow}>
          <View style={styles.bureauCol}>
            <View style={styles.bureauCard}>
              <Text style={[styles.bureauCardHeader, styles.bureauCardHeaderEq]}>EQUIFAX®</Text>
              <Text style={styles.bureauScore}>{equifaxScore}</Text>
              <Text style={styles.bureauDate}>{reportDateStr}</Text>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Accounts</Text>
                <Text style={styles.bureauStatValue}>—</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Inquiries</Text>
                <Text style={styles.bureauStatValue}>{props.hardInquiriesCount}</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Public Records</Text>
                <Text style={styles.bureauStatValue}>0</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Collections</Text>
                <Text style={styles.bureauStatValue}>{props.collectionsCount}</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Current Past Due</Text>
                <Text style={styles.bureauStatValue}>0</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Prior Past Due</Text>
                <Text style={styles.bureauStatValue}>0</Text>
              </View>
              <View style={styles.bureauPositiveNegative}>
                <Text style={styles.bureauStatLabel}>Positive</Text>
                <Text style={styles.bureauStatValue}>—</Text>
              </View>
              <View style={styles.bureauPositiveNegative}>
                <Text style={styles.bureauStatLabel}>Negative</Text>
                <Text style={[styles.bureauStatValue, { color: "#dc2626" }]}>{eqCount}</Text>
              </View>
            </View>
          </View>
          <View style={styles.bureauCol}>
            <View style={styles.bureauCard}>
              <Text style={[styles.bureauCardHeader, styles.bureauCardHeaderEx]}>experian</Text>
              <Text style={styles.bureauScore}>{experianScore}</Text>
              <Text style={styles.bureauDate}>{reportDateStr}</Text>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Accounts</Text>
                <Text style={styles.bureauStatValue}>—</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Inquiries</Text>
                <Text style={styles.bureauStatValue}>{props.hardInquiriesCount}</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Public Records</Text>
                <Text style={styles.bureauStatValue}>0</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Collections</Text>
                <Text style={styles.bureauStatValue}>{props.collectionsCount}</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Current Past Due</Text>
                <Text style={styles.bureauStatValue}>0</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Prior Past Due</Text>
                <Text style={styles.bureauStatValue}>0</Text>
              </View>
              <View style={styles.bureauPositiveNegative}>
                <Text style={styles.bureauStatLabel}>Positive</Text>
                <Text style={styles.bureauStatValue}>—</Text>
              </View>
              <View style={styles.bureauPositiveNegative}>
                <Text style={styles.bureauStatLabel}>Negative</Text>
                <Text style={[styles.bureauStatValue, { color: "#dc2626" }]}>{exCount}</Text>
              </View>
            </View>
          </View>
          <View style={styles.bureauCol}>
            <View style={styles.bureauCard}>
              <Text style={[styles.bureauCardHeader, styles.bureauCardHeaderTu]}>TransUnion</Text>
              <Text style={styles.bureauScore}>{transUnionScore}</Text>
              <Text style={styles.bureauDate}>{reportDateStr}</Text>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Accounts</Text>
                <Text style={styles.bureauStatValue}>—</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Inquiries</Text>
                <Text style={styles.bureauStatValue}>{props.hardInquiriesCount}</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Public Records</Text>
                <Text style={styles.bureauStatValue}>0</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Collections</Text>
                <Text style={styles.bureauStatValue}>{props.collectionsCount}</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Current Past Due</Text>
                <Text style={styles.bureauStatValue}>0</Text>
              </View>
              <View style={styles.bureauStatRow}>
                <Text style={styles.bureauStatLabel}>Prior Past Due</Text>
                <Text style={styles.bureauStatValue}>0</Text>
              </View>
              <View style={styles.bureauPositiveNegative}>
                <Text style={styles.bureauStatLabel}>Positive</Text>
                <Text style={styles.bureauStatValue}>—</Text>
              </View>
              <View style={styles.bureauPositiveNegative}>
                <Text style={styles.bureauStatLabel}>Negative</Text>
                <Text style={[styles.bureauStatValue, { color: "#dc2626" }]}>{tuCount}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.usageSectionTitle}>- Credit Card Usage -</Text>
        <Text style={styles.usageIntro}>
          If you're carrying high balances, try to pay your balances down to below 25% of the available credit limit of each card. Never spend more than that, even if you pay the bill off in full each month.
        </Text>
        <View style={styles.usageScale}>
          <View style={[styles.usageScaleSegment, { backgroundColor: "#22c55e" }]}>
            <Text style={styles.usageScaleLabel}>Excellent</Text>
          </View>
          <View style={[styles.usageScaleSegment, { backgroundColor: "#84cc16" }]}>
            <Text style={styles.usageScaleLabel}>Good</Text>
          </View>
          <View style={[styles.usageScaleSegment, { backgroundColor: "#3b82f6" }]}>
            <Text style={styles.usageScaleLabel}>Fair</Text>
          </View>
          <View style={[styles.usageScaleSegment, { backgroundColor: "#f97316" }]}>
            <Text style={styles.usageScaleLabel}>Poor</Text>
          </View>
          <View style={[styles.usageScaleSegment, { backgroundColor: "#ef4444" }]}>
            <Text style={styles.usageScaleLabel}>Very Poor</Text>
          </View>
        </View>

        <Footer page={3} />
      </Page>

      {/* Page 4: Your Derogatory Items */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.derogTitle}>- Your Derogatory Items -</Text>
        <Text style={styles.derogSub}>
          You have <Text style={styles.derogSubBold}>{items.length} items</Text> marked as delinquent or derogatory (negative).
        </Text>
        <Text style={styles.derogDesc}>
          Late payments, Collections, and other derogatory items within the last 6 months will hurt your credit score more so than older in-active accounts.
        </Text>

        {items.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            <View style={styles.tableHeader}>
              <Text style={styles.colAccount}>Account Name</Text>
              <Text style={styles.colType}>Dispute Type</Text>
              <Text style={styles.colEq}>Equifax</Text>
              <Text style={styles.colEx}>Experian</Text>
              <Text style={styles.colTu}>TransUnion</Text>
              <Text style={styles.colDetails}>Details</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colAccount}>{item.accountName}</Text>
                <Text style={styles.colType}>{item.accountType ?? "ACCOUNTS"}</Text>
                <Text style={styles.colEq}>
                  {showNegInBureau(item, "Equifax") ? (
                    <Text style={styles.negText}>Negative</Text>
                  ) : (
                    <Text style={styles.noneText}>None</Text>
                  )}
                </Text>
                <Text style={styles.colEx}>
                  {showNegInBureau(item, "Experian") ? (
                    <Text style={styles.negText}>Negative</Text>
                  ) : (
                    <Text style={styles.noneText}>None</Text>
                  )}
                </Text>
                <Text style={styles.colTu}>
                  {showNegInBureau(item, "TransUnion") ? (
                    <Text style={styles.negText}>Negative</Text>
                  ) : (
                    <Text style={styles.noneText}>None</Text>
                  )}
                </Text>
                <Text style={styles.colDetails}>
                  {item.negativeReason ?? (item.balance != null ? `Balance $${Number(item.balance).toLocaleString()}` : "—")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Footer page={4} />
      </Page>

      {/* Page 5: Let's Get Started */}
      <Page size="A4" style={styles.page}>
        {props.envelopeIconPath ? (
          <Image src={props.envelopeIconPath} style={styles.envelopeIconImage} />
        ) : (
          <Text style={styles.ctaIcon}>✉</Text>
        )}
        <Text style={styles.ctaTitle}>Let's Get Started!</Text>
        <Text style={styles.ctaBody}>
          If you have any questions, or are ready to get started on your journey to great credit, then please contact us on our website or with the information below.
        </Text>
        <View style={styles.ctaBrandBox}>
          {props.logoPath ? (
            <Image src={props.logoPath} style={[styles.logoImage, { marginBottom: 8 }]} />
          ) : (
            <Text style={styles.ctaBrand}>{BRAND.name}</Text>
          )}
          <Text style={[styles.coverUrl, { marginTop: 4 }]}>{BRAND.url}</Text>
        </View>

        <Footer page={5} />
      </Page>
    </Document>
  );
}

/** Resolve optional image paths from public/audit-assets/ (used when not provided in props) */
function resolveAuditAssetPaths(): { coverImagePath?: string; logoPath?: string; envelopeIconPath?: string } {
  const base = path.join(process.cwd(), "public", "audit-assets");
  const cover = path.join(base, "auditsccc.png");
  const logo = path.join(base, "logo.png");
  const envelope = path.join(base, "icon-envelope.png");
  return {
    coverImagePath: fs.existsSync(cover) ? cover : undefined,
    logoPath: fs.existsSync(logo) ? logo : undefined,
    envelopeIconPath: fs.existsSync(envelope) ? envelope : undefined,
  };
}

/** Generate audit PDF and return the buffer (for preview or custom save). */
export async function generateAuditPdfBuffer(props: AuditPdfProps): Promise<Buffer> {
  const assets = resolveAuditAssetPaths();
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
      totalRevolvingBalance={props.totalRevolvingBalance}
      totalRevolvingLimit={props.totalRevolvingLimit}
      reportSummary={props.reportSummary}
      summaryIssues={props.summaryIssues}
      recommendedSteps={props.recommendedSteps}
      capitalReadinessNotes={props.capitalReadinessNotes}
      negativeItems={props.negativeItems}
      coverImagePath={props.coverImagePath ?? assets.coverImagePath}
      logoPath={props.logoPath ?? assets.logoPath}
      envelopeIconPath={props.envelopeIconPath ?? assets.envelopeIconPath}
    />
  ).toBlob();
  return Buffer.from(await blob.arrayBuffer());
}

/** Build filename: credit-report-analysis-{{full-name}}.pdf (sanitized, lowercase, hyphens) */
function getAuditPdfFileName(clientName: string): string {
  const sanitized =
    (clientName || "client")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "client";
  return `credit-report-analysis-${sanitized}.pdf`;
}

export async function generateAuditPdf(props: AuditPdfProps): Promise<string | null> {
  try {
    const buffer = await generateAuditPdfBuffer(props);
    const baseName = getAuditPdfFileName(props.clientName);
    const storagePath = `audits/${baseName}`;

    if (isBlobStorageAvailable()) {
      const blobUrl = await uploadToBlob(buffer, storagePath, { contentType: "application/pdf" });
      return blobUrl;
    }

    const dir = path.join(process.cwd(), "uploads", "audits");
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, baseName);
    await writeFile(filePath, buffer);
    return path.relative(process.cwd(), filePath);
  } catch (e) {
    console.error("PDF generation failed:", e);
    return null;
  }
}
