"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BUREAUS } from "@/lib/constants";

type BureauScore = {
  bureau: "Experian" | "Equifax" | "TransUnion";
  score: number;
  previousScore: number | null;
  lastUpdated: Date;
};

export function Big3ScoreSnapshot({ scores }: { scores: BureauScore[] }) {
  const bureaus = BUREAUS;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {bureaus.map((bureau) => {
        const row = scores.find((s) => s.bureau === bureau);
        const score = row?.score ?? null;
        const prev = row?.previousScore ?? null;
        const change = score != null && prev != null ? score - prev : null;
        const lastUpdated = row?.lastUpdated;

        return (
          <div
            key={bureau}
            className="panel flex flex-col justify-between p-6 transition-colors hover:border-brand-500/30"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {bureau}
            </p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-white sm:text-4xl">
              {score ?? "—"}
            </p>
            {change != null && change !== 0 && (
              <p className="mt-1 flex items-center gap-1 text-sm">
                {change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-status-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-status-danger" />
                )}
                <span
                  className={
                    change > 0 ? "text-status-success" : "text-status-danger"
                  }
                >
                  {change > 0 ? "+" : ""}
                  {change} since last report
                </span>
              </p>
            )}
            {change === 0 && prev != null && (
              <p className="mt-1 flex items-center gap-1 text-sm text-text-muted">
                <Minus className="h-4 w-4" /> No change
              </p>
            )}
            {lastUpdated && (
              <p className="mt-3 text-xs text-slate-500">
                Updated {new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
