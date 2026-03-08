import Link from "next/link";
import { BUREAUS } from "@/lib/constants";

type Profile = {
  id: string;
  negativeItems: Array<{ id: string; accountName: string; bureau: string; currentOutcome: string | null }>;
  disputeRounds: Array<{
    id: string;
    roundType: string;
    roundNumber: number;
    bureau: string | null;
    dateSent: Date | null;
    outcome: string | null;
    items: unknown[];
  }>;
};

export function ClientTabDisputes({ profile }: { profile: Profile }) {
  const byBureau = BUREAUS.map((b) => ({
    bureau: b,
    count: profile.negativeItems.filter((i) => i.bureau === b).length,
  }));

  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <h2 className="section-heading">Negative items by bureau (all 3)</h2>
        <p className="section-sub mt-1">Experian, Equifax, TransUnion</p>
        <div className="mt-4 flex gap-4">
          {byBureau.map(({ bureau, count }) => (
            <div key={bureau} className="rounded-lg border border-surface-border bg-surface-card px-4 py-3">
              <p className="text-xs text-slate-400">{bureau}</p>
              <p className="text-xl font-bold text-white">{count}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card-elevated p-6">
        <h2 className="section-heading">Dispute rounds</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {profile.disputeRounds.map((r) => (
            <li key={r.id}>
              Round {r.roundNumber} · {r.roundType} · Bureau: {r.bureau ?? "—"} · {r.dateSent ? r.dateSent.toLocaleDateString() : "Not sent"} · {r.outcome ?? "—"}
            </li>
          ))}
        </ul>
        <Link href={`/admin/clients/${profile.id}/disputes`} className="mt-4 inline-block text-orange-400 hover:underline">
          Manage disputes →
        </Link>
      </div>
    </div>
  );
}
