"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Provider = { value: string; label: string };

export function CreditImportForm({ providers }: { providers: readonly Provider[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({
    provider: "",
    username: "",
    password: "",
    securityWord: "",
    last4SSN: "",
    phone: "",
    auditTemplate: "default",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/credit/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: form.provider,
          username: form.username || undefined,
          password: form.password || undefined,
          securityWord: form.securityWord || undefined,
          last4SSN: form.last4SSN || undefined,
          phone: form.phone || undefined,
          auditTemplateId: form.auditTemplate || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        return;
      }
      setInfo(typeof data.message === "string" ? data.message : "");
      router.refresh();
      if (data.auditId) router.push(`/dashboard/audits/${data.auditId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="section-heading">Provider credentials</h2>
      <p className="text-sm text-slate-400">
        Direct API import only runs when your organization configures{" "}
        <code className="rounded bg-surface-border px-1 text-xs">CREDIT_IMPORT_WEBHOOK_URL</code> to receive
        this request. Otherwise we store your details for staff and you should upload your PDF for instant analysis.
      </p>

      <div>
        <label htmlFor="provider" className="label">
          Provider
        </label>
        <select
          id="provider"
          value={form.provider}
          onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
          className="input-field"
          required
        >
          <option value="">Select provider</option>
          {providers.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="username" className="label">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          className="input-field"
          autoComplete="username"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="input-field"
          autoComplete="current-password"
        />
      </div>

      <div>
        <label htmlFor="securityWord" className="label">
          Security word / Security answer
        </label>
        <input
          id="securityWord"
          type="text"
          value={form.securityWord}
          onChange={(e) =>
            setForm((f) => ({ ...f, securityWord: e.target.value }))
          }
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="last4SSN" className="label">
          Last 4 of SSN
        </label>
        <input
          id="last4SSN"
          type="text"
          maxLength={4}
          value={form.last4SSN}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              last4SSN: e.target.value.replace(/\D/g, "").slice(0, 4),
            }))
          }
          className="input-field"
          placeholder="XXXX"
        />
      </div>

      <div>
        <label htmlFor="phone" className="label">
          Phone number (optional)
        </label>
        <input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="auditTemplate" className="label">
          Audit template
        </label>
        <select
          id="auditTemplate"
          value={form.auditTemplate}
          onChange={(e) =>
            setForm((f) => ({ ...f, auditTemplate: e.target.value }))
          }
          className="input-field"
        >
          <option value="default">Default</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {info && (
        <p className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2 text-sm text-slate-200">
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !form.provider}
        className="btn-primary flex items-center gap-2"
      >
        {loading ? "Importing…" : "Import My Credit Report"}
      </button>
    </form>
  );
}
