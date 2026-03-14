"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";

type NoteRow = { key: string; label: string; content: string; updatedAt: string | null };

export function AdminNotesClient({ initialNotes }: { initialNotes: NoteRow[] }) {
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes);
  const [saving, setSaving] = useState<string | null>(null);

  function setContent(key: string, content: string) {
    setNotes((prev) => prev.map((n) => (n.key === key ? { ...n, content } : n)));
  }

  async function save(key: string) {
    const note = notes.find((n) => n.key === key);
    if (!note) return;
    setSaving(key);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, content: note.content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setNotes((prev) =>
        prev.map((n) => (n.key === key ? { ...n, content: updated.content, updatedAt: updated.updatedAt } : n))
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="card-elevated space-y-6">
      <h2 className="section-heading">Stored credentials</h2>
      <p className="section-sub">Edit and save. Only admins can view this page.</p>
      <div className="space-y-6">
        {notes.map((note) => (
          <div key={note.key} className="rounded-xl border border-surface-border bg-surface-card p-4">
            <label className="block text-sm font-medium text-slate-300">{note.label}</label>
            <textarea
              className="mt-2 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              rows={4}
              value={note.content}
              placeholder={`Paste ${note.label} here...`}
              onChange={(e) => setContent(note.key, e.target.value)}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {note.updatedAt ? `Updated ${new Date(note.updatedAt).toLocaleString()}` : "Not saved yet"}
              </span>
              <button
                type="button"
                onClick={() => save(note.key)}
                disabled={saving === note.key}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {saving === note.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
