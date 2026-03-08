"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Trash2 } from "lucide-react";

const categoryLabels: Record<string, string> = {
  bureau_dispute: "Bureau dispute",
  mov: "Method of verification",
  creditor: "Creditor direct dispute",
  cfpb: "CFPB complaint",
  collection: "Collection challenge",
  inquiry_removal: "Inquiry removal",
  custom: "Custom",
};

type Template = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  roundType: string | null;
  createdAt: Date;
};

export function LetterTemplateManager({
  templates,
  categories,
}: {
  templates: Template[];
  categories: string[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("bureau_dispute");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError("Title and file are required");
      return;
    }
    setError("");
    setSaving(true);
    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("category", category);
    formData.set("description", description.trim());
    formData.set("file", file);
    try {
      const res = await fetch("/api/admin/letter-templates", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setTitle("");
      setDescription("");
      setFile(null);
      setShowForm(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/admin/letter-templates?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="btn-primary inline-flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {showForm ? "Cancel" : "Upload template"}
      </button>

      {showForm && (
        <form onSubmit={handleUpload} className="card-elevated space-y-4 p-6">
          <h2 className="section-heading">New template</h2>
          <div>
            <label className="label">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c] ?? c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={2}
            />
          </div>
          <div>
            <label className="label">Template file (PDF or DOC)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-text-secondary file:mr-3 file:rounded file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-white"
            />
          </div>
          {error && (
            <p className="text-sm text-status-danger">{error}</p>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Uploading…" : "Upload"}
          </button>
        </form>
      )}

      <div className="rounded-lg border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-card text-left text-text-secondary">
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Default</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-b border-surface-border/50 text-slate-300">
                <td className="px-4 py-3">{t.title}</td>
                <td className="px-4 py-3">{categoryLabels[t.category] ?? t.category}</td>
                <td className="px-4 py-3">
                  <span className={t.isActive ? "text-status-success" : "text-text-muted"}>
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">{t.isDefault ? "Yes" : "—"}</td>
                <td className="px-4 py-3">
                  <a
                    href={`/api/admin/letter-templates/download?id=${t.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:underline mr-3"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="text-status-danger hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {templates.length === 0 && !showForm && (
        <p className="py-8 text-center text-text-muted">No templates yet. Upload one to get started.</p>
      )}
    </div>
  );
}
