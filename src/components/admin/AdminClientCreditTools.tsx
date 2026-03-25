"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BUREAUS } from "@/lib/constants";

type NegativeRow = {
  id: string;
  accountName: string;
  bureau: string;
  accountType: string | null;
  balance: unknown;
  negativeReason: string | null;
};

export function AdminClientCreditTools({
  clientProfileId,
  negativeItems,
}: {
  clientProfileId: string;
  negativeItems: NegativeRow[];
}) {
  const router = useRouter();
  const [ex, setEx] = useState("");
  const [eq, setEq] = useState("");
  const [tu, setTu] = useState("");
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreErr, setScoreErr] = useState("");

  const [accName, setAccName] = useState("");
  const [bureau, setBureau] = useState<(typeof BUREAUS)[number]>("Experian");
  const [accType, setAccType] = useState("");
  const [balance, setBalance] = useState("");
  const [reason, setReason] = useState("");
  const [negSaving, setNegSaving] = useState(false);
  const [negErr, setNegErr] = useState("");

  async function saveScores(e: React.FormEvent) {
    e.preventDefault();
    setScoreErr("");
    const experian = ex.trim() ? parseInt(ex, 10) : undefined;
    const equifax = eq.trim() ? parseInt(eq, 10) : undefined;
    const transUnion = tu.trim() ? parseInt(tu, 10) : undefined;
    if (experian == null && equifax == null && transUnion == null) {
      setScoreErr("Enter at least one score");
      return;
    }
    setScoreSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientProfileId}/manual-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experian: Number.isFinite(experian) ? experian : undefined,
          equifax: Number.isFinite(equifax) ? equifax : undefined,
          transUnion: Number.isFinite(transUnion) ? transUnion : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setScoreErr(data.error ?? "Save failed");
        return;
      }
      setEx("");
      setEq("");
      setTu("");
      router.refresh();
    } finally {
      setScoreSaving(false);
    }
  }

  async function addNegative(e: React.FormEvent) {
    e.preventDefault();
    if (!accName.trim()) return;
    setNegErr("");
    setNegSaving(true);
    try {
      const bal = balance.trim() ? parseFloat(balance) : undefined;
      const res = await fetch(`/api/admin/clients/${clientProfileId}/negative-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: accName.trim(),
          bureau,
          accountType: accType.trim() || undefined,
          balance: Number.isFinite(bal) ? bal : undefined,
          negativeReason: reason.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNegErr(data.error ?? "Failed to add");
        return;
      }
      setAccName("");
      setAccType("");
      setBalance("");
      setReason("");
      router.refresh();
    } finally {
      setNegSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="card-elevated p-6">
        <h2 className="section-heading">Record scores manually</h2>
        <p className="section-sub mt-1">
          Adds a new row to score history; client dashboard and charts update after refresh.
        </p>
        <form onSubmit={saveScores} className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-400">Experian</label>
            <input
              type="number"
              min={300}
              max={850}
              value={ex}
              onChange={(e) => setEx(e.target.value)}
              className="input-field mt-1"
              placeholder="300–850"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Equifax</label>
            <input
              type="number"
              min={300}
              max={850}
              value={eq}
              onChange={(e) => setEq(e.target.value)}
              className="input-field mt-1"
              placeholder="300–850"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">TransUnion</label>
            <input
              type="number"
              min={300}
              max={850}
              value={tu}
              onChange={(e) => setTu(e.target.value)}
              className="input-field mt-1"
              placeholder="300–850"
            />
          </div>
          {scoreErr && <p className="sm:col-span-3 text-sm text-red-400">{scoreErr}</p>}
          <div className="sm:col-span-3">
            <button type="submit" disabled={scoreSaving} className="btn-primary">
              {scoreSaving ? "Saving…" : "Save scores"}
            </button>
          </div>
        </form>
      </div>

      <div className="card-elevated p-6">
        <h2 className="section-heading">Negative items (manual)</h2>
        <p className="section-sub mt-1">Adds a tradeline to this client; visible on overview, disputes, and letters.</p>
        <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto text-sm text-slate-300">
          {negativeItems.slice(0, 40).map((n) => (
            <li key={n.id}>
              {n.accountName} · {n.bureau}
              {n.accountType ? ` · ${n.accountType}` : ""}
            </li>
          ))}
        </ul>
        <form onSubmit={addNegative} className="mt-4 space-y-3 border-t border-surface-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400">Account / creditor name</label>
              <input
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                className="input-field mt-1"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Bureau</label>
              <select
                value={bureau}
                onChange={(e) => setBureau(e.target.value as (typeof BUREAUS)[number])}
                className="input-field mt-1"
              >
                {BUREAUS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Type (optional)</label>
              <input
                value={accType}
                onChange={(e) => setAccType(e.target.value)}
                className="input-field mt-1"
                placeholder="e.g. Collection"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Balance (optional)</label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Reason (optional)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field mt-1"
              />
            </div>
          </div>
          {negErr && <p className="text-sm text-red-400">{negErr}</p>}
          <button type="submit" disabled={negSaving} className="btn-primary">
            {negSaving ? "Adding…" : "Add negative item"}
          </button>
        </form>
      </div>
    </div>
  );
}
