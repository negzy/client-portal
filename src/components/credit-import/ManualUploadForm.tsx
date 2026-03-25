"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText } from "lucide-react";

export function ManualUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noDataMessage, setNoDataMessage] = useState(false);
  const [noDataExtracted, setNoDataExtracted] = useState(false);

  async function handleFileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file");
      return;
    }
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("type", "pdf");
    try {
      const res = await fetch("/api/credit/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      router.refresh();
      if (data.noDataDetected) {
        setError("");
        setNoDataMessage(true);
        setNoDataExtracted((data.extractedLength ?? 0) === 0);
        setTimeout(() => {
          if (data.auditId) router.push(`/dashboard/audits/${data.auditId}`);
          else router.push("/dashboard");
        }, 5000);
        return;
      }
      if (data.auditId) router.push(`/dashboard/audits/${data.auditId}`);
      else router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-elevated space-y-6 p-6">
      <h2 className="section-heading">Upload 3-bureau credit report (PDF)</h2>
      <p className="text-sm text-slate-400">
        We read scores, inquiries, score factors, account-level late-payment details, and collections from the PDF text.
        Image-only scans may not parse — use &quot;Connect monitoring&quot; below if your organization enables automatic import.
      </p>

      <form onSubmit={handleFileSubmit} className="space-y-4">
        <div>
          <label className="label flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-400" />
            Credit report PDF
          </label>
          <div className="mt-2 flex items-center gap-4">
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-500 file:px-4 file:py-2.5 file:font-medium file:text-white file:hover:bg-brand-400"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {noDataMessage && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            {noDataExtracted
              ? "No text could be read from this PDF (it may be image-only or scanned). Your file was saved to your vault. Contact your specialist or try a different export from your monitoring site."
              : "We couldn&apos;t find enough data in this PDF. Your file was saved. Contact your specialist or confirm you uploaded the full 3-bureau report export."}{" "}
            You can still open your audit or dashboard.
          </p>
        )}
        <p className="text-xs text-slate-500">
          Your report will be analyzed automatically and a Credit Report Analysis PDF will be generated when parsing succeeds.
        </p>
        <button type="submit" disabled={loading || !file} className="btn-primary flex items-center gap-2">
          <Upload className="h-4 w-4" />
          {loading ? "Uploading…" : "Upload and analyze"}
        </button>
      </form>
    </div>
  );
}
