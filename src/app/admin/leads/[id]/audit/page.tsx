import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LeadAuditRunner } from "./LeadAuditRunner";

export default async function LeadAuditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/login");
  }

  const lead = await prisma.contact.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      clientProfileId: true,
    },
  });
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Lead Audit Call View</h1>
          <p className="page-sub">
            {lead.fullName} · {lead.email}
          </p>
        </div>
        <Link
          href="/admin/leads"
          className="rounded-md border border-surface-border px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Back to Leads
        </Link>
      </div>

      {lead.clientProfileId ? (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
          This lead is already converted to a client. Use the client portal audit flow for ongoing audits.
        </div>
      ) : null}

      <div className="rounded-xl border border-surface-border bg-slate-900/40 p-4 text-sm text-slate-300">
        <p>
          <span className="text-slate-100">Status:</span> {lead.status ?? "lead"}
        </p>
        <p>
          <span className="text-slate-100">Phone:</span> {lead.phone ?? "—"}
        </p>
      </div>

      <LeadAuditRunner leadId={lead.id} />
    </div>
  );
}

