"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminClientPrivateNotes({
  clientProfileId,
  initialCfpb,
  initialCreditMonitoring,
  initialEmail,
}: {
  clientProfileId: string;
  initialCfpb: string | null;
  initialCreditMonitoring: string | null;
  initialEmail: string | null;
}) {
  const router = useRouter();
  const [cfpb, setCfpb] = useState(initialCfpb ?? "");
  const [monitoring, setMonitoring] = useState(initialCreditMonitoring ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientProfileId}/admin-notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNotesCfpb: cfpb.trim() || null,
          adminNotesCreditMonitoring: monitoring.trim() || null,
          adminNotesEmail: email.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card-elevated space-y-4 p-6">
      <h2 className="section-heading">Admin-only file notes</h2>
      <p className="section-sub mt-1">
        CFPB, credit monitoring access, email context — not visible to the client.
      </p>
      <div>
        <label className="text-xs font-medium text-slate-400">CFPB / complaint details</label>
        <textarea
          value={cfpb}
          onChange={(e) => setCfpb(e.target.value)}
          rows={3}
          className="input-field mt-1 min-h-[5rem]"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-400">Credit monitoring (admin)</label>
        <textarea
          value={monitoring}
          onChange={(e) => setMonitoring(e.target.value)}
          rows={3}
          className="input-field mt-1 min-h-[5rem]"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-400">Email / comms notes</label>
        <textarea
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          rows={3}
          className="input-field mt-1 min-h-[5rem]"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Saving…" : "Save admin notes"}
      </button>
    </form>
  );
}
