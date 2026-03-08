"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  bankName: string;
  productName: string;
  bureauPull: string | null;
  notes: string | null;
  typicalScoreMin: number | null;
  typicalScoreMax: number | null;
  relationshipBanking: boolean;
  status: string | null;
};

export function BankMatrixManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bankName: "",
    productName: "",
    bureauPull: "",
    notes: "",
    typicalScoreMin: "",
    typicalScoreMax: "",
    relationshipBanking: false,
    status: "available",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/bank-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankName: form.bankName,
        productName: form.productName,
        bureauPull: form.bureauPull || null,
        notes: form.notes || null,
        typicalScoreMin: form.typicalScoreMin ? parseInt(form.typicalScoreMin, 10) : null,
        typicalScoreMax: form.typicalScoreMax ? parseInt(form.typicalScoreMax, 10) : null,
        relationshipBanking: form.relationshipBanking,
        status: form.status,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({
        bankName: "",
        productName: "",
        bureauPull: "",
        notes: "",
        typicalScoreMin: "",
        typicalScoreMax: "",
        relationshipBanking: false,
        status: "available",
      });
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="btn-primary"
      >
        {showForm ? "Cancel" : "Add bank / product"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold text-white">New bank product</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Bank name</label>
              <input
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Product name</label>
              <input
                value={form.productName}
                onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Bureau pull</label>
              <select
                value={form.bureauPull}
                onChange={(e) => setForm((f) => ({ ...f, bureauPull: e.target.value }))}
                className="input-field"
              >
                <option value="">—</option>
                <option value="Experian">Experian</option>
                <option value="Equifax">Equifax</option>
                <option value="TransUnion">TransUnion</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="input-field"
              >
                <option value="available">Available</option>
                <option value="not_offered">Not offered</option>
                <option value="on_hold">On hold</option>
                <option value="not_ready">Not ready</option>
              </select>
            </div>
            <div>
              <label className="label">Score range (min)</label>
              <input
                type="number"
                value={form.typicalScoreMin}
                onChange={(e) => setForm((f) => ({ ...f, typicalScoreMin: e.target.value }))}
                className="input-field"
                placeholder="e.g. 620"
              />
            </div>
            <div>
              <label className="label">Score range (max)</label>
              <input
                type="number"
                value={form.typicalScoreMax}
                onChange={(e) => setForm((f) => ({ ...f, typicalScoreMax: e.target.value }))}
                className="input-field"
                placeholder="e.g. 750"
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.relationshipBanking}
                onChange={(e) =>
                  setForm((f) => ({ ...f, relationshipBanking: e.target.checked }))
                }
              />
              <label className="text-sm text-slate-300">Relationship banking required</label>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="input-field"
                rows={2}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Add
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-slate-400">
            <th className="pb-2 pr-4">Bank</th>
            <th className="pb-2 pr-4">Product</th>
            <th className="pb-2 pr-4">Bureau</th>
            <th className="pb-2 pr-4">Score range</th>
            <th className="pb-2 pr-4">Relationship</th>
            <th className="pb-2">Status</th>
          </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-surface-border/50 text-slate-300"
              >
                <td className="py-3 pr-4">{p.bankName}</td>
                <td className="py-3 pr-4">{p.productName}</td>
                <td className="py-3 pr-4">{p.bureauPull ?? "—"}</td>
                <td className="py-3 pr-4">
                  {p.typicalScoreMin != null || p.typicalScoreMax != null
                    ? `${p.typicalScoreMin ?? "—"} - ${p.typicalScoreMax ?? "—"}`
                    : "—"}
                </td>
                <td className="py-3 pr-4">
                  {p.relationshipBanking ? "Yes" : "—"}
                </td>
                <td className="py-3">{p.status ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
