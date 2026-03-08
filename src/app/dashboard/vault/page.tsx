import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DocumentUpload } from "@/components/vault/DocumentUpload";
import { VaultDocumentList } from "@/components/vault/VaultDocumentList";

const categoryLabels: Record<string, string> = {
  ID: "ID",
  UTILITY_BILL: "Utility bill",
  SOCIAL_EIN: "Social / EIN",
  LLC_DOCS: "LLC docs",
  CREDIT_REPORT: "Credit report",
  BUREAU_RESPONSE: "Bureau response",
  DISPUTE_DOCS: "Dispute docs",
  BANK_STATEMENT: "Bank statement",
  VOIDED_CHECK: "Voided check",
  BUSINESS_VERIFICATION: "Business verification",
  OTHER: "Other",
};

export default async function VaultPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard");

  const documents = await prisma.document.findMany({
    where: { clientProfileId: profile.id },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Document vault</h1>
        <p className="page-sub">
          Upload and view ID, utility bills, credit reports, and more. You can remove documents anytime.
        </p>
      </div>

      <DocumentUpload clientProfileId={profile.id} />

      <section className="card-elevated">
        <h2 className="section-heading">Your documents</h2>
        <p className="section-sub mt-1">Download or remove documents you’ve uploaded.</p>
        <VaultDocumentList
          documents={documents.map((d) => ({
            id: d.id,
            fileName: d.fileName,
            filePath: d.filePath,
            category: d.category,
            uploadedAt: d.uploadedAt,
          }))}
          categoryLabels={categoryLabels}
        />
      </section>
    </div>
  );
}
