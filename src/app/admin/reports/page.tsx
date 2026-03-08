import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminReportsCharts } from "@/components/admin/AdminReportsCharts";

export default async function AdminReportsPage() {
  await getServerSession(authOptions);

  const [
    clientCount,
    disputesByBureau,
    applicationStatusCounts,
    taskCompletion,
    negativeItemsByBureau,
  ] = await Promise.all([
    prisma.clientProfile.count(),
    prisma.negativeItem.groupBy({
      by: ["bureau"],
      _count: true,
    }),
    prisma.application.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.task.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.negativeItem.groupBy({
      by: ["bureau"],
      _count: true,
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Reports</h1>
        <p className="mt-2 text-slate-400">
          Charts and summaries across clients
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="kpi-card">
          <p className="text-sm font-medium text-slate-400">Total clients</p>
          <p className="text-2xl font-bold text-white">{clientCount}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm font-medium text-slate-400">Total negative items</p>
          <p className="text-2xl font-bold text-white">
            {negativeItemsByBureau.reduce((s, b) => s + b._count, 0)}
          </p>
        </div>
        <div className="kpi-card">
          <p className="text-sm font-medium text-slate-400">Total applications</p>
          <p className="text-2xl font-bold text-white">
            {applicationStatusCounts.reduce((s, a) => s + a._count, 0)}
          </p>
        </div>
      </div>

      <AdminReportsCharts
        disputesByBureau={disputesByBureau}
        applicationStatusCounts={applicationStatusCounts}
        taskCompletion={taskCompletion}
        negativeItemsByBureau={negativeItemsByBureau}
      />
    </div>
  );
}
