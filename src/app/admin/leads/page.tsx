import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LeadConvertButton } from "./LeadConvertButton";

export default async function AdminLeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/login");
  }

  const leads = await prisma.contact.findMany({
    where: { clientProfileId: null },
    orderBy: { createdAt: "desc" },
    include: {
      assignedAdmin: { select: { name: true } },
      affiliate: { select: { name: true, code: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Leads</h1>
        <p className="page-sub">Convert leads to clients</p>
      </div>
      <div className="card-elevated overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No leads yet. Use the public lead form to capture leads.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="p-4 font-semibold text-white">Name</th>
                <th className="p-4 font-semibold text-white">Email</th>
                <th className="p-4 font-semibold text-white">Phone</th>
                <th className="p-4 font-semibold text-white">Status</th>
                <th className="p-4 font-semibold text-white">Source</th>
                <th className="p-4 font-semibold text-white">Assigned</th>
                <th className="p-4 font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-surface-border/50">
                  <td className="p-4">{lead.fullName}</td>
                  <td className="p-4 text-slate-300">{lead.email}</td>
                  <td className="p-4 text-slate-400">{lead.phone ?? "—"}</td>
                  <td className="p-4">
                    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">
                      {lead.status ?? "lead"}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{lead.source ?? "—"}</td>
                  <td className="p-4 text-slate-400">{lead.assignedAdmin?.name ?? "—"}</td>
                  <td className="p-4">
                    <LeadConvertButton contactId={lead.id} contactEmail={lead.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-sm text-slate-500">
        Public form: <Link href="/lead" className="text-orange-500 hover:underline">/lead</Link>
      </p>
    </div>
  );
}
