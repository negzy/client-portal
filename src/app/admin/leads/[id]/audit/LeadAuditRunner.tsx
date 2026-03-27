"use client";

import { useState } from "react";

type AuditResponse = {
  success: boolean;
  pdfUrl: string | null;
  summary: {
    scoreSnapshot: string | null;
    negativeCount: number;
    collectionsCount: number;
    chargeOffsCount: number;
    hardInquiriesCount: number;
    hardInquiriesPerBureau: { equifax: number; experian: number; transUnion: number } | null;
    utilizationPct: number | null;
    summaryIssues: string;
    recommendedSteps: string;
  };
};

export function LeadAuditRunner({ leadId }: { leadId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResponse | null>(null);

  async function onRunAudit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/leads/${leadId}/audit`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to run lead audit");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run lead audit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-border bg-slate-950/40 p-4">
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Upload lead credit report (PDF)
        </label>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mb-3 block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-orange-500/20 file:px-3 file:py-2 file:text-orange-300 hover:file:bg-orange-500/30"
        />
        <button
          onClick={onRunAudit}
          disabled={!file || loading}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Running audit..." : "Run Lead Audit"}
        </button>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-surface-border bg-slate-900/40 p-4">
            <h3 className="mb-2 text-base font-semibold text-white">Lead Audit Summary</h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-300 md:grid-cols-2">
              <p>Scores: {result.summary.scoreSnapshot ?? "Not detected"}</p>
              <p>Negative items: {result.summary.negativeCount}</p>
              <p>Collections: {result.summary.collectionsCount}</p>
              <p>Charge-offs: {result.summary.chargeOffsCount}</p>
              <p>
                Inquiries: {result.summary.hardInquiriesCount}
                {result.summary.hardInquiriesPerBureau
                  ? ` (EQ ${result.summary.hardInquiriesPerBureau.equifax}, EX ${result.summary.hardInquiriesPerBureau.experian}, TU ${result.summary.hardInquiriesPerBureau.transUnion})`
                  : ""}
              </p>
              <p>
                Utilization:{" "}
                {result.summary.utilizationPct == null ? "N/A" : `${result.summary.utilizationPct}%`}
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              <span className="font-medium text-white">Issues: </span>
              {result.summary.summaryIssues}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              <span className="font-medium text-white">Recommended steps: </span>
              {result.summary.recommendedSteps}
            </p>
          </div>
          {result.pdfUrl ? (
            <a
              href={result.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
            >
              Open Lead Audit PDF
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

