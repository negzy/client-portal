import Link from "next/link";

type Profile = {
  id: string;
  user: { name: string | null; email: string };
  negativeItems: Array<{ id: string; accountName: string; bureau: string; currentOutcome: string | null }>;
  disputeRounds: Array<{ id: string; roundType: string; roundNumber: number; dateSent: Date | null; outcome: string | null }>;
  tasks: Array<{ id: string; title: string; status: string; dueDate: Date | null; assignedBy: { name: string | null } | null }>;
  applications: Array<{ id: string; bankName: string; productName: string; status: string }>;
  audits: Array<{ id: string; auditDate: Date }>;
  processStage: string | null;
  agreementSignedAt: Date | null;
};

export function ClientTabOverview({
  profile,
  bureau,
}: {
  profile: Profile;
  bureau: { experian: number; equifax: number; transUnion: number };
}) {
  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <h2 className="section-heading">Quick overview</h2>
        <p className="section-sub mt-1">Stage progress and key metrics</p>
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-slate-400">Stage</p>
            <p className="text-lg font-semibold text-white">{profile.processStage ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Negative items (all 3 bureaus)</p>
            <p className="text-lg font-semibold text-white">
              Experian: {bureau.experian} · Equifax: {bureau.equifax} · TransUnion: {bureau.transUnion}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Agreement</p>
            <p className="text-lg font-semibold text-white">
              {profile.agreementSignedAt ? "Signed " + new Date(profile.agreementSignedAt).toLocaleDateString() : "Not signed"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-elevated p-6">
          <h2 className="section-heading">Negative items</h2>
          <p className="section-sub mt-1">{profile.negativeItems.length} items across Experian, Equifax, TransUnion</p>
          <ul className="mt-4 space-y-1 text-sm text-slate-300">
            {profile.negativeItems.slice(0, 8).map((item) => (
              <li key={item.id}>{item.accountName} · {item.bureau} · {item.currentOutcome ?? "—"}</li>
            ))}
          </ul>
          <Link href={`/admin/clients/${profile.id}?tab=disputes`} className="mt-4 inline-block text-orange-400 hover:underline">
            Manage disputes →
          </Link>
        </section>
        <section className="card-elevated p-6">
          <h2 className="section-heading">Dispute rounds</h2>
          <ul className="mt-4 space-y-1 text-sm text-slate-300">
            {profile.disputeRounds.slice(0, 5).map((r) => (
              <li key={r.id}>
                Round {r.roundNumber} · {r.roundType} · {r.dateSent ? r.dateSent.toLocaleDateString() : "Not sent"} · {r.outcome ?? "—"}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card-elevated p-6">
        <h2 className="section-heading">Applications</h2>
        <ul className="mt-4 space-y-1 text-sm text-slate-300">
          {profile.applications.slice(0, 5).map((a) => (
            <li key={a.id}>{a.bankName} · {a.productName} · {a.status}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/letters?clientId=${profile.id}`} className="btn-primary">Generate letter</Link>
        <Link href={`/admin/messages?clientId=${profile.id}`} className="btn-secondary">Message client</Link>
      </div>
    </div>
  );
}
