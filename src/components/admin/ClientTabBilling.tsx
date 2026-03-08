import Link from "next/link";

type Inv = { id: string; amountCents: number; currency: string; status: string; dueDate: Date | null; paidAt: Date | null };

export function ClientTabBilling({ profile }: { profile: { id: string; invoices: Inv[] } }) {
  return (
    <div className="card-elevated p-6">
      <h2 className="section-heading">Invoices</h2>
      <p className="section-sub mt-1">Client billing</p>
      {profile.invoices.length === 0 ? (
        <p className="mt-4 text-slate-400">No invoices yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {profile.invoices.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-card px-4 py-3 text-sm">
              <span className="text-white">${(inv.amountCents / 100).toFixed(2)} {inv.currency}</span>
              <span className={inv.status === "paid" ? "text-emerald-400" : "text-slate-400"}>{inv.status}</span>
              <span className="text-slate-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/admin/invoices" className="mt-4 inline-block text-orange-400 hover:underline">
        View all invoices →
      </Link>
    </div>
  );
}
