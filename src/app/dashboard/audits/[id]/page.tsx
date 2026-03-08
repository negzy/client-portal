import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) return null;

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return null;

  const audit = await prisma.audit.findFirst({
    where: { id, clientProfileId: profile.id },
  });
  if (!audit) notFound();

  const downloadUrl = audit.pdfPath
    ? `/api/documents/download?path=${encodeURIComponent(audit.pdfPath)}`
    : null;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
      <div className="card">
        <h1 className="text-xl font-bold text-white">Credit Audit</h1>
        <p className="mt-1 text-slate-400">
          {audit.auditDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-400">Client</p>
            <p className="font-medium text-white">{audit.clientName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Negative items</p>
            <p className="font-medium text-white">{audit.negativeCount}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Collections</p>
            <p className="font-medium text-white">{audit.collectionsCount}</p>
          </div>
        </div>
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download audit PDF
          </a>
        )}
      </div>
    </div>
  );
}
