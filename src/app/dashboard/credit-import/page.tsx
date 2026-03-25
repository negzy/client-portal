import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreditImportContent } from "@/components/credit-import/CreditImportContent";
import {
  auditNegativeImportWindow,
  isStructuredLatePaymentAccountType,
} from "@/lib/audit-import-window";

export default async function CreditImportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard");

  const latestAudit = await prisma.audit.findFirst({
    where: { clientProfileId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  let latePaymentsFromLatestImport: {
    accountName: string;
    bureau: string;
    accountType: string | null;
    negativeReason: string | null;
  }[] = [];

  if (latestAudit) {
    const importWindow = auditNegativeImportWindow(latestAudit.createdAt);
    const batch = await prisma.negativeItem.findMany({
      where: {
        clientProfileId: profile.id,
        dateImported: { gte: importWindow.gte, lte: importWindow.lte },
      },
      orderBy: [{ accountName: "asc" }, { bureau: "asc" }, { accountType: "asc" }],
    });
    latePaymentsFromLatestImport = batch
      .filter((n) => isStructuredLatePaymentAccountType(n.accountType))
      .map((n) => ({
        accountName: n.accountName,
        bureau: n.bureau,
        accountType: n.accountType,
        negativeReason: n.negativeReason,
      }));
  }

  return (
    <CreditImportContent
      latestAudit={
        latestAudit
          ? {
              id: latestAudit.id,
              auditDate: latestAudit.auditDate.toISOString(),
              scoreSnapshot: latestAudit.scoreSnapshot,
              negativeCount: latestAudit.negativeCount,
              pdfPath: latestAudit.pdfPath,
              latePayments: latePaymentsFromLatestImport,
            }
          : null
      }
    />
  );
}
