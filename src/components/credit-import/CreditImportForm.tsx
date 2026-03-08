"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Provider = { value: string; label: string };

export function CreditImportForm({ providers }: { providers: readonly Provider[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      router.refresh();
      if (data.auditId) router.push(`/dashboard/audits/${data.auditId}`);
      else router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="section-heading">Provider credentials</h2>

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
