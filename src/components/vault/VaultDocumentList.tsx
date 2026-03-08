"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type DocumentRow = {
  id: string;
  fileName: string;
  filePath: string;
  category: string;
  uploadedAt: Date;
};

export function VaultDocumentList({
  documents,
  categoryLabels,
}: {
  documents: DocumentRow[];
  categoryLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmId(null);
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (!documents.length) {
    return (
      <p className="mt-4 text-slate-400">No documents yet. Upload one above.</p>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-card p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white truncate">{doc.fileName}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {categoryLabels[doc.category] ?? doc.category} ·{" "}
              {new Date(doc.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {confirmId === doc.id ? (
              <>
                <span className="text-xs text-slate-400">Delete?</span>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
                >
                  {deletingId === doc.id ? "…" : "Yes"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <a
                  href={`/api/documents/download?path=${encodeURIComponent(doc.filePath)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-400 hover:text-brand-300 hover:underline"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setConfirmId(doc.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
