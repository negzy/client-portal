"use client";

type Props = { score: number; size?: number };

export function FundingReadinessGauge({ score, size = 200 }: Props) {
  const clamped = Math.min(100, Math.max(0, score));
  const r = Math.min(45, (size * 0.45) / 2);
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const color = clamped >= 70 ? "#22c55e" : clamped >= 40 ? "#f97316" : "#ef4444";

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="rotate-[-90deg]" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          className="text-surface-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">{clamped}</span>
        <span className="text-sm text-slate-400 sm:text-base">/ 100</span>
        <p className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">Funding Readiness</p>
      </div>
    </div>
  );
}
