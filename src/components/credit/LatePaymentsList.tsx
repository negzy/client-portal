type LateRow = {
  accountName: string;
  bureau: string;
  accountType: string | null;
  negativeReason: string | null;
};

export function LatePaymentsList({
  items,
  emptyHint,
}: {
  items: LateRow[];
  emptyHint?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {emptyHint ??
          "No structured late-payment rows (30/60/90/120 days past due with counts) were parsed for this import."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-border">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="border-b border-surface-border bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">Account</th>
            <th className="px-3 py-2 font-medium">Bureau</th>
            <th className="px-3 py-2 font-medium">Severity</th>
            <th className="px-3 py-2 font-medium">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border text-slate-200">
          {items.map((row, i) => (
            <tr key={`${row.accountName}-${row.bureau}-${row.accountType}-${i}`}>
              <td className="px-3 py-2 font-medium text-white">{row.accountName}</td>
              <td className="px-3 py-2 text-slate-400">{row.bureau}</td>
              <td className="px-3 py-2 text-amber-200/90">{row.accountType ?? "—"}</td>
              <td className="max-w-[280px] px-3 py-2 text-slate-400">{row.negativeReason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-surface-border px-3 py-2 text-xs text-slate-500">
        Parsed from each account&apos;s{" "}
        <span className="text-slate-400">30 / 60 / 90 / 120 Days Past Due</span> table (EQ / EX / TU columns with
        counts &gt; 0).
      </p>
    </div>
  );
}
