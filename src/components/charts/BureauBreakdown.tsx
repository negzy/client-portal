"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { BUREAUS } from "@/lib/constants";

const BUREAU_COLORS: Record<string, string> = { Experian: "#f97316", Equifax: "#fb923c", TransUnion: "#fdba74" };

type Props = {
  experian: number;
  equifax: number;
  transUnion: number;
};

export function BureauBreakdown({ experian, equifax, transUnion }: Props) {
  const total = experian + equifax + transUnion;
  const data = BUREAUS.map((name) => ({
    name,
    count: name === "Experian" ? experian : name === "Equifax" ? equifax : transUnion,
    fill: BUREAU_COLORS[name],
  }));

  if (total === 0) {
    return (
      <div className="flex h-[160px] flex-col items-center justify-center rounded-lg border border-dashed border-surface-border bg-surface-card/30 text-center">
        <p className="text-sm text-slate-400">No negative items by bureau yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
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
