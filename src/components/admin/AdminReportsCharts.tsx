"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ensureAllThreeBureaus } from "@/lib/constants";

type Props = {
  disputesByBureau: { bureau: string; _count: number }[];
  applicationStatusCounts: { status: string; _count: number }[];
  taskCompletion: { status: string; _count: number }[];
  negativeItemsByBureau: { bureau: string; _count: number }[];
};

export function AdminReportsCharts(props: Props) {
  const bureauData = ensureAllThreeBureaus(props.negativeItemsByBureau);

  const appData = props.applicationStatusCounts.map((a) => ({
    name: a.status.replace("_", " "),
    value: a._count,
  }));

  const taskComplete = props.taskCompletion.find((t) => t.status === "COMPLETE")?._count ?? 0;
  const taskTotal = props.taskCompletion.reduce((s, t) => s + t._count, 0) || 1;
  const taskPct = Math.round((taskComplete / taskTotal) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card-elevated">
        <h2 className="section-heading">Negative items by bureau (all 3 bureaus)</h2>
        <p className="section-sub">Experian, Equifax, TransUnion</p>
        <div className="mt-4 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bureauData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="card-elevated">
        <h2 className="section-heading">Applications by status</h2>
        <div className="mt-4 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={appData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                              >
                {appData.map((_, i) => (
                  <Cell key={i} fill={["#64748b", "#3b82f6", "#f59e0b", "#22c55e", "#ef4444", "#f97316"][i % 6]} />
                ))}
              </Pie>
              <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="card-elevated lg:col-span-2">
        <h2 className="section-heading">Task completion rate</h2>
        <p className="section-sub">{taskComplete} of {taskTotal} tasks completed</p>
        <div className="mt-4 h-6 w-full overflow-hidden rounded-full bg-surface-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
            style={{ width: `${taskPct}%` }}
          />
        </div>
      </section>
    </div>
  );
}
