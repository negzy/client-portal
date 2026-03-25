"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LeadConvertButton({ contactId, contactEmail }: { contactId: string; contactEmail: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConvert() {
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/leads/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message ?? data.error ?? "Failed to convert");
        return;
      }
      setOpen(false);
      setPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-orange-500/20 px-3 py-1.5 text-sm font-medium text-orange-400 hover:bg-orange-500/30"
      >
        Convert to client
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="w-full max-w-sm rounded-xl border border-surface-border bg-surface-card p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="convert-lead-title"
          >
            <h3 id="convert-lead-title" className="font-semibold text-white">Convert lead to client</h3>
            <p className="mt-1 text-sm text-slate-400">
              Creates a new account for <strong>{contactEmail}</strong>. They can sign in with this email and the password you set.
            </p>
            <div className="mt-4">
              <label className="label">Initial password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="input-field mt-1"
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => { setOpen(false); setError(""); setPassword(""); }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvert}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? "Converting…" : "Convert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
