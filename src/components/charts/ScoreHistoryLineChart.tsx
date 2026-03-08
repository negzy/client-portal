"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Point = { date: string; Experian?: number; Equifax?: number; TransUnion?: number };

const MIN_POINTS_FOR_CHART = 2;

export function ScoreHistoryLineChart({ data }: { data: Point[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-surface-border bg-surface-card/30 px-4 text-center">
        <p className="text-sm text-slate-400">No score history yet.</p>
        <p className="mt-1 text-sm text-slate-500">Import a credit report to record your first scores.</p>
      </div>
    );
  }

  if (data.length < MIN_POINTS_FOR_CHART) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-surface-border bg-surface-card/30 px-4 text-center">
        <p className="text-sm text-slate-400">Import another credit report to see score history over time.</p>
        <p className="mt-1 text-xs text-slate-500">Current snapshot is recorded; add more reports for a trend line.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 12, right: 12, left: 12, bottom: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis domain={["dataMin - 20", "dataMax + 20"]} tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#141c2e",
            border: "1px solid #1e293b",
            borderRadius: "6px",
          }}
          labelStyle={{ color: "#f8fafc" }}
        />
        <Legend formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>} />
        <Line type="monotone" dataKey="Experian" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Equifax" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="TransUnion" stroke="#fdba74" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
