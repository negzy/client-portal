import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  ListTodo,
  FileText,
  Building2,
  FolderOpen,
  MessageSquare,
  Activity,
  ArrowRight,
} from "lucide-react";

export default async function AdminDashboardPage() {
  await getServerSession(authOptions);

  const [
    clientCount,
    activeClients,
    taskCount,
    tasksDueToday,
    disputeRounds,
    negativeItemsCount,
    pendingApplications,
    recentActivities,
  ] = await Promise.all([
    prisma.clientProfile.count(),
    prisma.clientProfile.count({ where: { status: "active" } }),
    prisma.task.count({ where: { status: { in: ["NOT_STARTED", "IN_PROGRESS", "WAITING"] } } }),
    prisma.task.count({
      where: {
        status: { in: ["NOT_STARTED", "IN_PROGRESS", "WAITING"] },
        dueDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.disputeRound.count(),
    prisma.negativeItem.count(),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.timelineActivity.findMany({
      take: 10,
      orderBy: { occurredAt: "desc" },
      include: {
        clientProfile: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    }),
  ]);

  const activities = Array.isArray(recentActivities) ? recentActivities : [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Admin dashboard
        </h1>
        <p className="mt-2 text-slate-400">
          Operations command center
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/clients" className="kpi-card card-hover flex items-center gap-4">
          <div className="rounded-xl bg-brand-500/20 p-3">
            <Users className="h-7 w-7 text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Total clients</p>
            <p className="text-2xl font-bold text-white">{clientCount}</p>
          </div>
        </Link>
        <Link href="/admin/tasks" className="kpi-card card-hover flex items-center gap-4">
          <div className="rounded-xl bg-amber-500/20 p-3">
            <ListTodo className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Open tasks</p>
            <p className="text-2xl font-bold text-white">{taskCount}</p>
            {tasksDueToday > 0 && (
              <p className="text-xs text-amber-400">{tasksDueToday} due today</p>
            )}
          </div>
        </Link>
        <div className="kpi-card flex items-center gap-4">
          <div className="rounded-xl bg-blue-500/20 p-3">
            <Building2 className="h-7 w-7 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Pending applications</p>
            <p className="text-2xl font-bold text-white">{pendingApplications}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Link href="/admin/disputes" className="kpi-card card-hover">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-brand-400" />
            <span className="section-heading">Dispute rounds</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{disputeRounds}</p>
          <p className="mt-1 text-sm text-slate-400">Total rounds tracked</p>
        </Link>
        <div className="kpi-card">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-slate-400" />
            <span className="section-heading">Negative items</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{negativeItemsCount}</p>
          <p className="mt-1 text-sm text-slate-400">Across all clients</p>
        </div>
        <Link href="/admin/documents" className="kpi-card card-hover">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-brand-400" />
            <span className="section-heading">Documents</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">View client uploads</p>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-elevated">
          <h2 className="section-heading">Quick actions</h2>
          <p className="section-sub">Jump to key areas</p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href="/admin/clients" className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-card px-4 py-3 text-white hover:border-brand-500/40 hover:bg-brand-500/10">
                View all clients <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </li>
            <li>
              <Link href="/admin/disputes" className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-card px-4 py-3 text-white hover:border-brand-500/40 hover:bg-brand-500/10">
                Dispute tracker <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </li>
            <li>
              <Link href="/admin/letters" className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-card px-4 py-3 text-white hover:border-brand-500/40 hover:bg-brand-500/10">
                Generate letters <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </li>
            <li>
              <Link href="/admin/messages" className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-card px-4 py-3 text-white hover:border-brand-500/40 hover:bg-brand-500/10">
                Messages <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </li>
          </ul>
        </section>
        <section className="card-elevated">
          <h2 className="section-heading">Recent activity</h2>
          <p className="section-sub">Latest timeline events</p>
          <ul className="mt-4 space-y-2">
            {activities.length === 0 ? (
              <li className="py-6 text-center text-slate-500">No recent activity</li>
            ) : (
              activities.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl border border-surface-border bg-surface-card p-3"
                >
                  <Activity className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <div>
                    <p className="text-sm font-medium text-white">{a.title}</p>
                    <p className="text-xs text-slate-500">
                      {a.clientProfile?.user?.name ?? a.clientProfile?.user?.email ?? "Client"} ·{" "}
                      {new Date(a.occurredAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
