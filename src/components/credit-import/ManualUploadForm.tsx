"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Image, Edit3 } from "lucide-react";

export function ManualUploadForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"pdf" | "screenshot" | "manual">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [experianScore, setExperianScore] = useState("");
  const [equifaxScore, setEquifaxScore] = useState("");
  const [transUnionScore, setTransUnionScore] = useState("");
  const [noDataMessage, setNoDataMessage] = useState(false);
  const [noDataExtracted, setNoDataExtracted] = useState(false);

  async function handleFileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("type", mode);
    if (experianScore.trim()) formData.set("experianScore", experianScore.trim());
    if (equifaxScore.trim()) formData.set("equifaxScore", equifaxScore.trim());
    if (transUnionScore.trim()) formData.set("transUnionScore", transUnionScore.trim());
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
      <h2 className="section-heading">Manual upload</h2>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "pdf", label: "Credit report PDF", icon: FileText },
            { id: "screenshot", label: "Screenshot", icon: Image },
            { id: "manual", label: "Manual entry", icon: Edit3 },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              mode === id
                ? "border-brand-500 bg-brand-500/20 text-brand-400"
                : "border-surface-border text-slate-400 hover:bg-surface-border/50 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {mode === "manual" ? (
        <div className="rounded-xl border border-surface-border bg-surface-card p-4">
          <p className="text-sm text-slate-400">
            Manual entry backup: your admin can add negative items and run an
            audit from the admin panel. You can also upload documents to the
            Document Vault for staff to process.
          </p>
          <a
            href="/dashboard/vault"
            className="mt-2 inline-block text-brand-400 hover:underline"
          >
            Go to Document Vault →
          </a>
        </div>
      ) : (
        <form onSubmit={handleFileSubmit} className="space-y-4">
          <div className="rounded-lg border border-brand-500/40 bg-brand-500/10 p-4">
            <p className="text-sm font-medium text-white">Enter your 3 bureau scores (300–850)</p>
            <p className="mt-1 text-xs text-slate-400">
              We try to read scores from the PDF, but many PDFs don&apos;t support that. Enter your Experian, Equifax, and TransUnion scores here so your Credit Report Analysis is always complete.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs text-slate-400">Experian</label>
                <input
                  type="number"
                  min={300}
                  max={850}
                  placeholder="e.g. 746"
                  value={experianScore}
                  onChange={(e) => setExperianScore(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="mt-1 w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Equifax</label>
                <input
                  type="number"
                  min={300}
                  max={850}
                  placeholder="e.g. 758"
                  value={equifaxScore}
                  onChange={(e) => setEquifaxScore(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="mt-1 w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">TransUnion</label>
                <input
                  type="number"
                  min={300}
                  max={850}
                  placeholder="e.g. 741"
                  value={transUnionScore}
                  onChange={(e) => setTransUnionScore(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="mt-1 w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label">
              {mode === "pdf"
                ? "Upload credit report PDF"
                : "Upload screenshot(s)"}
            </label>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="file"
                accept={mode === "pdf" ? "application/pdf" : "image/*"}
                multiple={mode === "screenshot"}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-500 file:px-4 file:py-2.5 file:font-medium file:text-white file:hover:bg-brand-400"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {noDataMessage && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
              {noDataExtracted
                ? "No text could be read from this PDF (it may be image-only or scanned). Your file was saved. Enter your 3 bureau scores above and click Upload again to get a full Credit Report Analysis."
                : "We couldn't find scores or items in the PDF. Enter your 3 bureau scores above and click Upload again for a full report."}
              {" "}You can also view your audit now.
            </p>
          )}
          <p className="text-xs text-slate-500">
            Your report will be analyzed automatically and a Credit Report Analysis PDF will be generated for you.
          </p>
          <button
            type="submit"
            disabled={loading || !file}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {loading ? "Uploading…" : "Upload and analyze"}
          </button>
        </form>
      )}
    </div>
  );
}
