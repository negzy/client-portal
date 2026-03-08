"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "ID", label: "ID" },
  { value: "UTILITY_BILL", label: "Utility bill" },
  { value: "SOCIAL_EIN", label: "Social / EIN" },
  { value: "LLC_DOCS", label: "LLC docs" },
  { value: "CREDIT_REPORT", label: "Credit report" },
  { value: "BUREAU_RESPONSE", label: "Bureau response" },
  { value: "DISPUTE_DOCS", label: "Dispute docs" },
  { value: "BANK_STATEMENT", label: "Bank statement" },
  { value: "VOIDED_CHECK", label: "Voided check" },
  { value: "BUSINESS_VERIFICATION", label: "Business verification" },
  { value: "OTHER", label: "Other" },
];

export function DocumentUpload({ clientProfileId }: { clientProfileId: string }) {
  const router = useRouter();
  const [category, setCategory] = useState("OTHER");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Select a file");
      return;
    }
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("category", category);
    formData.set("clientProfileId", clientProfileId);
    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setFile(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold text-white">Upload document</h2>
      <div>
        <label className="label">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-field"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">File</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-white"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || !file}
        className="btn-primary"
      >
        {loading ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
