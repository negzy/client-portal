"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  planned: number;
  submitted: number;
  pending: number;
  approved: number;
  denied: number;
  onHold: number;
};

export function ApplicationsChart(props: Props) {
  const total =
    props.planned + props.submitted + props.pending + props.approved + props.denied + props.onHold;
  const data = [
    { name: "Planned", count: props.planned, fill: "#64748b" },
    { name: "Submitted", count: props.submitted, fill: "#3b82f6" },
    { name: "Pending", count: props.pending, fill: "#f59e0b" },
    { name: "Approved", count: props.approved, fill: "#22c55e" },
    { name: "Denied", count: props.denied, fill: "#ef4444" },
    { name: "On hold", count: props.onHold, fill: "#f97316" },
  ].filter((d) => d.count > 0);

  if (total === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-surface-border bg-surface-card/30 text-center">
        <p className="text-sm text-slate-400">No applications tracked yet.</p>
        <p className="mt-1 text-xs text-slate-500">Track funding applications from the Applications page.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a2332",
            border: "1px solid #1e293b",
            borderRadius: "12px",
          }}
          labelStyle={{ color: "#f8fafc" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
