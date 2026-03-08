import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileInput, ListTodo, AlertCircle, ArrowRight } from "lucide-react";
import { BUREAUS } from "@/lib/constants";
import { CreditRepairDonut } from "@/components/charts/CreditRepairDonut";
import { TaskProgressBar } from "@/components/charts/TaskProgressBar";
import { ApplicationsChart } from "@/components/charts/ApplicationsChart";
import { BureauBreakdown } from "@/components/charts/BureauBreakdown";
import { Big3ScoreSnapshot } from "@/components/charts/Big3ScoreSnapshot";
import { ScoreHistoryLineChart } from "@/components/charts/ScoreHistoryLineChart";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: {
          negativeItems: true,
          tasks: true,
          applications: true,
        },
      },
    },
  });

  const itemsInDispute = profile
    ? await prisma.negativeItem.count({
        where: {
          clientProfileId: profile.id,
          currentOutcome: "disputed",
        },
      })
    : 0;
  const itemsRemoved = profile
    ? await prisma.negativeItem.count({
        where: {
          clientProfileId: profile.id,
          currentOutcome: "removed",
        },
      })
    : 0;
  const itemsVerified = profile
    ? await prisma.negativeItem.count({
        where: {
          clientProfileId: profile.id,
          currentOutcome: "verified",
        },
      })
    : 0;
  const tasksPending = profile
    ? await prisma.task.count({
        where: {
          clientProfileId: profile.id,
          status: { in: ["NOT_STARTED", "IN_PROGRESS", "WAITING"] },
        },
      })
    : 0;
  const tasksComplete = profile
    ? await prisma.task.count({
        where: {
          clientProfileId: profile.id,
          status: "COMPLETE",
        },
      })
    : 0;
  const totalTasks = (profile?._count?.tasks ?? 0) || 1;

  const applications = profile
    ? await prisma.application.groupBy({
        by: ["status"],
        where: { clientProfileId: profile.id },
        _count: true,
      })
    : [];
  const appByStatus = {
    planned: applications.find((a) => a.status === "PLANNED")?._count ?? 0,
    submitted: applications.find((a) => a.status === "SUBMITTED")?._count ?? 0,
    pending: applications.find((a) => a.status === "PENDING")?._count ?? 0,
    approved: applications.find((a) => a.status === "APPROVED")?._count ?? 0,
    denied: applications.find((a) => a.status === "DENIED")?._count ?? 0,
    onHold: applications.find((a) => a.status === "ON_HOLD")?._count ?? 0,
  };

  const bureauCounts = profile
    ? await prisma.negativeItem.groupBy({
        by: ["bureau"],
        where: { clientProfileId: profile.id },
        _count: true,
      })
    : [];
  const bureau = {
    experian: bureauCounts.find((b) => b.bureau === "Experian")?._count ?? 0,
    equifax: bureauCounts.find((b) => b.bureau === "Equifax")?._count ?? 0,
    transUnion: bureauCounts.find((b) => b.bureau === "TransUnion")?._count ?? 0,
  };

  const totalNegative = profile?._count?.negativeItems ?? 0;

  const scoreHistoryRows = profile
    ? await prisma.scoreHistory.findMany({
        where: { clientProfileId: profile.id },
        orderBy: { recordedAt: "asc" },
        take: 50,
      })
    : [];
  const latestByBureau = profile
    ? await Promise.all(
        (["Experian", "Equifax", "TransUnion"] as const).map(async (b) => {
          const latest = await prisma.scoreHistory.findFirst({
            where: { clientProfileId: profile.id, bureau: b },
            orderBy: { recordedAt: "desc" },
          });
          const previous = latest
            ? await prisma.scoreHistory.findFirst({
                where: { clientProfileId: profile.id, bureau: b },
                orderBy: { recordedAt: "desc" },
                skip: 1,
              })
            : null;
          return latest
            ? {
                bureau: b,
                score: latest.score,
                previousScore: previous?.score ?? null,
                lastUpdated: latest.recordedAt,
              }
            : null;
        })
      )
    : [];
  const big3Scores = latestByBureau.filter(Boolean) as {
    bureau: "Experian" | "Equifax" | "TransUnion";
    score: number;
    previousScore: number | null;
    lastUpdated: Date;
  }[];

  const scoreLineData = (() => {
    const byDate: Record<string, { dateStr: string; date: string; Experian?: number; Equifax?: number; TransUnion?: number }> = {};
    scoreHistoryRows.forEach((r) => {
      const d = r.recordedAt.toISOString().slice(0, 10);
      if (!byDate[d]) byDate[d] = { dateStr: d, date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) };
      byDate[d][r.bureau] = r.score;
    });
    return Object.values(byDate)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
      .map(({ date, ...rest }) => ({ date, ...rest }));
  })();

  const hasAnyData = scoreHistoryRows.length > 0 || totalNegative > 0 || (profile?._count?.tasks ?? 0) > 0;

  return (
    <div className="space-y-10">
      {/* Get started: when no data yet, single clear CTA */}
      {!hasAnyData && profile && (
        <section className="rounded-2xl border border-brand-500/40 bg-brand-500/10 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">Get started</h2>
          <p className="mt-2 max-w-md mx-auto text-slate-400">
            Import your first credit report to see your scores, track progress, and get next steps from your team.
          </p>
          <Link
            href="/dashboard/credit-import"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-400"
          >
            <FileInput className="h-5 w-5" />
            Import credit report
          </Link>
        </section>
      )}

      {/* Overview */}
      <section>
        <h1 className="page-title">
          Welcome back{profile ? `, ${session.user?.name || "Client"}` : ""}
        </h1>
        <p className="page-sub">
          Your credit repair and funding readiness command center
        </p>
      </section>

      {/* Row 1: Big 3 bureau score cards */}
      <section>
        <h2 className="section-heading">Credit score snapshot</h2>
        <p className="section-sub mt-1">Current scores for all 3 bureaus: Experian, Equifax, TransUnion</p>
        <div className="mt-4">
          <Big3ScoreSnapshot scores={big3Scores} />
        </div>
      </section>

      {/* Row 2: Credit Import, Open Tasks, Negative Items */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/dashboard/credit-import"
            className="kpi-card card-hover flex min-h-[140px] items-center gap-4"
          >
            <div className="rounded-lg bg-brand-500/20 p-3">
              <FileInput className="h-6 w-6 text-brand-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-400">Credit Import</p>
              <p className="text-lg font-bold text-white">Import report</p>
            </div>
          </Link>
          <div className="kpi-card flex min-h-[140px] items-center gap-4">
            <div className="rounded-lg bg-amber-500/20 p-3">
              <ListTodo className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Open tasks</p>
              <p className="text-lg font-bold text-white">{tasksPending}</p>
            </div>
          </div>
          <div className="kpi-card flex min-h-[140px] items-center gap-4">
            <div className="rounded-lg bg-brand-500/20 p-3">
              <AlertCircle className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Negative items</p>
              <p className="text-lg font-bold text-white">
                {totalNegative} total · {itemsRemoved} removed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Score history line chart */}
      <section className="card-elevated p-6">
        <h2 className="section-heading">Score history</h2>
        <p className="section-sub mt-1">Progress over time</p>
        <div className="mt-6">
          <ScoreHistoryLineChart data={scoreLineData} />
        </div>
      </section>

      {/* Credit Repair Donut + Bureau + Task progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card-elevated p-6">
          <h2 className="section-heading">Credit repair progress</h2>
          <p className="section-sub mt-1">Negative items by status</p>
          <div className="mt-6 min-h-[220px]">
            <CreditRepairDonut
              total={totalNegative}
              inDispute={itemsInDispute}
              removed={itemsRemoved}
              verified={itemsVerified}
            />
          </div>
          <Link
            href="/dashboard/credit-import"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300"
          >
            Import credit report <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
        <section className="card-elevated p-6">
          <h2 className="section-heading">By bureau (all 3)</h2>
          <p className="section-sub mt-1">Negative items per bureau: Experian, Equifax, TransUnion</p>
          <div className="mt-6">
            <BureauBreakdown
              experian={bureau.experian}
              equifax={bureau.equifax}
              transUnion={bureau.transUnion}
            />
          </div>
        </section>
        <section className="card-elevated p-6">
          <h2 className="section-heading">Task completion</h2>
          <p className="section-sub mt-1">Your progress on assigned tasks</p>
          <div className="mt-6">
            <TaskProgressBar completed={tasksComplete} total={totalTasks} />
          </div>
          <Link
            href="/dashboard/tasks"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300"
          >
            View all tasks <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>

      {/* Applications + Funding CTA */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-elevated p-6">
          <h2 className="section-heading">Applications</h2>
          <p className="section-sub mt-1">Funding applications by status</p>
          <div className="mt-6 min-h-[200px]">
            <ApplicationsChart
              planned={appByStatus.planned}
              submitted={appByStatus.submitted}
              pending={appByStatus.pending}
              approved={appByStatus.approved}
              denied={appByStatus.denied}
              onHold={appByStatus.onHold}
            />
          </div>
          <Link
            href="/dashboard/applications"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300"
          >
            View applications <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
        <section className="card-elevated p-6">
          <h2 className="section-heading">Progress</h2>
          <p className="section-sub mt-1">Next steps and progress</p>
          <Link
            href="/dashboard/progress"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300"
          >
            View full progress <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
