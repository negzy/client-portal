"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

type Props = {
  total: number;
  inDispute: number;
  removed: number;
  verified: number;
};

const COLORS = ["#f97316", "#f59e0b", "#22c55e", "#64748b"];

export function CreditRepairDonut({
  total,
  inDispute,
  removed,
  verified,
}: Props) {
  const other = Math.max(0, total - inDispute - removed - verified);
  const data = [
    { name: "In dispute", value: inDispute, fill: COLORS[0] },
    { name: "Removed", value: removed, fill: COLORS[2] },
    { name: "Verified", value: verified, fill: COLORS[3] },
    { name: "Other", value: other, fill: COLORS[1] },
  ].filter((d) => d.value > 0);

  if (total === 0 || data.length === 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-surface-border bg-surface-card/30 text-center">
        <p className="text-sm text-slate-400">No disputes yet.</p>
        <p className="mt-1 text-xs text-slate-500">Import a credit report to identify negative items to dispute.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
          stroke="transparent"
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
