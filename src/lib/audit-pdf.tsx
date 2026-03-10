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
    padding: 44,
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  title: {
    fontSize: 24,
    marginBottom: 6,
    fontWeight: "bold",
    color: "#0c1222",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 28,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#f97316",
    paddingBottom: 6,
    color: "#0c1222",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: 150,
    color: "#64748b",
  },
  value: {
    flex: 1,
    color: "#1e293b",
  },
  scoreBox: {
    backgroundColor: "#fff7ed",
    padding: 16,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#c2410c",
  },
  bullet: {
    marginLeft: 12,
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 44,
    right: 44,
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
  },
});

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
  fundingReadinessScore: number;
  capitalReadinessNotes: string;
};

function AuditDocument(props: AuditPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CreditLyft Audit</Text>
        <Text style={styles.subtitle}>
          Credit audit report · {props.auditDate.toLocaleDateString("en-US")}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client & date</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Client name</Text>
            <Text style={styles.value}>{props.clientName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date of audit</Text>
            <Text style={styles.value}>
              {props.auditDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>

        {props.scoreSnapshot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credit score snapshot</Text>
            <Text style={styles.value}>{props.scoreSnapshot}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Negative items</Text>
            <Text style={styles.value}>{props.negativeCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Collections</Text>
            <Text style={styles.value}>{props.collectionsCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Charge-offs</Text>
            <Text style={styles.value}>{props.chargeOffsCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hard inquiries</Text>
            <Text style={styles.value}>{props.hardInquiriesCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Utilization</Text>
            <Text style={styles.value}>
              {props.utilizationPct != null ? `${props.utilizationPct}%` : "—"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top issues</Text>
          <Text style={styles.value}>{props.summaryIssues}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended next steps</Text>
          <Text style={styles.value}>{props.recommendedSteps}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.scoreBox}>
            <Text style={styles.sectionTitle}>Funding readiness score</Text>
            <Text style={styles.scoreValue}>{props.fundingReadinessScore} / 100</Text>
          </View>
          <Text style={styles.sectionTitle}>Capital readiness notes</Text>
          <Text style={styles.value}>{props.capitalReadinessNotes}</Text>
        </View>

        <Text style={styles.footer}>
          CreditLyft Portal · This report is for informational use. Not legal or
          financial advice.
        </Text>
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
        fundingReadinessScore={props.fundingReadinessScore}
        capitalReadinessNotes={props.capitalReadinessNotes}
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
