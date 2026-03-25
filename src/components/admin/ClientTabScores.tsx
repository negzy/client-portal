import { BUREAUS } from "@/lib/constants";
import { AdminClientCreditTools } from "@/components/admin/AdminClientCreditTools";

type ScoreRow = { bureau: string; score: number; previousScore: number | null; recordedAt: Date };

type NegRow = {
  id: string;
  accountName: string;
  bureau: string;
  accountType: string | null;
  balance: unknown;
  negativeReason: string | null;
};

export function ClientTabScores({
  profile,
}: {
  profile: {
    id: string;
    user: { name: string | null; email: string };
    scoreHistory: ScoreRow[];
    negativeItems: NegRow[];
  };
}) {
  const byBureau = BUREAUS.map((b) => {
    const latest = profile.scoreHistory.find((r) => r.bureau === b);
    return { bureau: b, score: latest?.score ?? null, date: latest?.recordedAt };
  });

  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <h2 className="section-heading">Current scores (all 3 bureaus)</h2>
        <p className="section-sub mt-1">Experian, Equifax, TransUnion</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {byBureau.map(({ bureau, score, date }) => (
            <div key={bureau} className="rounded-xl border border-surface-border bg-surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{bureau}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-white">{score ?? "—"}</p>
              {date && <p className="mt-1 text-xs text-slate-500">{new Date(date).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      </div>
      <div className="card-elevated p-6">
        <h2 className="section-heading">Score history</h2>
        {profile.scoreHistory.length === 0 ? (
          <p className="mt-4 text-slate-400">No score history yet. Import a credit report to record scores.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {profile.scoreHistory.slice(0, 15).map((r, i) => (
              <li key={i} className="flex justify-between text-slate-300">
                <span>{r.bureau} · {new Date(r.recordedAt).toLocaleDateString()}</span>
                <span className="font-medium text-white">{r.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AdminClientCreditTools clientProfileId={profile.id} negativeItems={profile.negativeItems} />
    </div>
  );
}
