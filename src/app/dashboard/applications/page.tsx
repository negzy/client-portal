import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const statusColors: Record<string, string> = {
  PLANNED: "bg-slate-500/30 text-slate-300",
  SUBMITTED: "bg-blue-500/30 text-blue-300",
  PENDING: "bg-amber-500/30 text-amber-300",
  APPROVED: "bg-emerald-500/30 text-emerald-300",
  DENIED: "bg-red-500/30 text-red-300",
  ON_HOLD: "bg-orange-500/30 text-orange-300",
};

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard");

  const applications = await prisma.application.findMany({
    where: { clientProfileId: profile.id },
    orderBy: { dateSubmitted: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Applications tracker</h1>
        <p className="page-sub">
          Banks and products you’re targeting or have applied to
        </p>
      </div>

      {!applications.length ? (
        <div className="card-elevated py-12 text-center text-slate-400">
          No applications yet. Your admin will add planned and submitted
          applications here.
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card text-left text-slate-400">
                <th className="pb-2 pl-4 pr-4">Bank</th>
                <th className="pb-2 pr-4">Product</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Bureau</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Submitted</th>
                <th className="pb-2 pr-4">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-surface-border/50 text-slate-300"
                >
                  <td className="py-3 pl-4 pr-4">{app.bankName}</td>
                  <td className="py-3 pr-4">{app.productName}</td>
                  <td className="py-3 pr-4">
                    {app.applicationType.replace(/_/g, " ")}
                  </td>
                  <td className="py-3 pr-4">{app.bureauPulled ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        statusColors[app.status] ?? "bg-slate-500/30"
                      }`}
                    >
                      {app.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {app.dateSubmitted
                      ? app.dateSubmitted.toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {app.followUpDate
                      ? app.followUpDate.toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
