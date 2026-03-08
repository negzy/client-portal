import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PLANNED: "bg-slate-500/30 text-slate-300",
  SUBMITTED: "bg-blue-500/30 text-blue-300",
  PENDING: "bg-amber-500/30 text-amber-300",
  APPROVED: "bg-emerald-500/30 text-emerald-300",
  DENIED: "bg-red-500/30 text-red-300",
  ON_HOLD: "bg-orange-500/30 text-orange-300",
};

export default async function AdminApplicationsPage() {
  await getServerSession(authOptions);

  const applications = await prisma.application.findMany({
    orderBy: { dateSubmitted: "desc" },
    take: 200,
    include: {
      clientProfile: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Applications</h1>
        <p className="mt-2 text-slate-400">
          All funding applications across clients
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-card text-left text-slate-400">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                className="border-b border-surface-border/50 text-slate-300"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clients/${app.clientProfileId}`}
                    className="text-brand-400 hover:underline"
                  >
                    {app.clientProfile?.user?.name ?? app.clientProfile?.user?.email ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3">{app.bankName}</td>
                <td className="px-4 py-3">{app.productName}</td>
                <td className="px-4 py-3">
                  {app.applicationType.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                      statusColors[app.status] ?? "bg-slate-500/30"
                    }`}
                  >
                    {app.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {app.dateSubmitted
                    ? app.dateSubmitted.toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clients/${app.clientProfileId}`}
                    className="text-brand-400 hover:underline"
                  >
                    View client
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {applications.length === 0 && (
        <p className="py-12 text-center text-slate-500">No applications yet.</p>
      )}
    </div>
  );
}
