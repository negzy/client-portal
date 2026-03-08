import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

export default async function AdminDocumentsPage() {
  await getServerSession(authOptions);

  const documents = await prisma.document.findMany({
    take: 200,
    orderBy: { uploadedAt: "desc" },
    include: {
      clientProfile: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Documents</h1>
        <p className="mt-2 text-slate-400">
          Client uploads across all profiles
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-card text-left text-slate-400">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="border-b border-surface-border/50 text-slate-300"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clients/${doc.clientProfileId}`}
                    className="text-brand-400 hover:underline"
                  >
                    {doc.clientProfile?.user?.name ?? doc.clientProfile?.user?.email ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {categoryLabels[doc.category] ?? doc.category}
                </td>
                <td className="px-4 py-3">{doc.fileName}</td>
                <td className="px-4 py-3">
                  {doc.uploadedAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/api/documents/download?path=${encodeURIComponent(doc.filePath)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:underline"
                  >
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {documents.length === 0 && (
        <p className="py-12 text-center text-slate-500">No documents yet.</p>
      )}
    </div>
  );
}
