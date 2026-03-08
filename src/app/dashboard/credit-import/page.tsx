import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreditImportContent } from "@/components/credit-import/CreditImportContent";

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

  return (
    <CreditImportContent
      latestAudit={
        latestAudit
          ? {
              id: latestAudit.id,
              auditDate: latestAudit.auditDate.toISOString(),
              scoreSnapshot: latestAudit.scoreSnapshot,
              negativeCount: latestAudit.negativeCount,
              fundingReadinessScore: latestAudit.fundingReadinessScore,
              pdfPath: latestAudit.pdfPath,
            }
          : null
      }
    />
  );
}
