"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditImportForm } from "@/components/credit-import/CreditImportForm";
import { ManualUploadForm } from "@/components/credit-import/ManualUploadForm";
import { Shield, FileText, ArrowRight, Download } from "lucide-react";

const PROVIDERS = [
  { value: "MyFreeScoreNow", label: "MyFreeScoreNow" },
  { value: "IdentityIQ", label: "IdentityIQ" },
  { value: "SmartCredit", label: "SmartCredit" },
  { value: "MyScoreIQ", label: "MyScoreIQ" },
] as const;

type LatestAudit = {
  id: string;
  auditDate: string;
  scoreSnapshot: string | null;
  negativeCount: number;
  fundingReadinessScore: number | null;
  pdfPath: string | null;
};

export function CreditImportContent({
  latestAudit,
}: {
  latestAudit: LatestAudit | null;
}) {
  const [showProviderImport, setShowProviderImport] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Import your credit report</h1>
        <p className="page-sub">
          Upload a PDF or screenshot of your report — we'll read your scores when possible. You can also enter scores manually.
        </p>
      </div>

      {latestAudit && (
        <section className="card-elevated p-6">
          <h2 className="section-heading flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-400" />
            Your latest report
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {new Date(latestAudit.auditDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestAudit.scoreSnapshot && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Scores</p>
                <p className="mt-0.5 font-medium text-white">{latestAudit.scoreSnapshot}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Negative items</p>
              <p className="mt-0.5 font-medium text-white">{latestAudit.negativeCount}</p>
            </div>
            {latestAudit.fundingReadinessScore != null && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Funding readiness</p>
                <p className="mt-0.5 font-medium text-white">{latestAudit.fundingReadinessScore}/100</p>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/audits/${latestAudit.id}`}
              className="btn-primary inline-flex items-center gap-2"
            >
              View audit <ArrowRight className="h-4 w-4" />
            </Link>
            {latestAudit.pdfPath && (
              <a
                href={`/api/documents/download?path=${encodeURIComponent(latestAudit.pdfPath)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download audit PDF
              </a>
            )}
          </div>
        </section>
      )}

      <section className="card-elevated p-6">
        <h2 className="section-heading">
          {latestAudit ? "Upload a new report" : "Manual upload"}
        </h2>
        {!showProviderImport ? (
          <>
            <ManualUploadForm />
            <div className="mt-6 rounded-xl border border-dashed border-surface-border p-6">
              <p className="text-sm text-slate-400">
                Prefer to connect a monitoring provider?
              </p>
              <button
                type="button"
                onClick={() => setShowProviderImport(true)}
                className="mt-3 inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium"
              >
                <Shield className="h-4 w-4" />
                Import from MyFreeScoreNow, IdentityIQ, SmartCredit, or MyScoreIQ →
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 flex items-center gap-2 text-sm text-slate-400">
              <Shield className="h-4 w-4 text-brand-500" />
              Secure encrypted import · Your credentials are used only for report retrieval
            </p>
            <CreditImportForm providers={PROVIDERS} />
            <button
              type="button"
              onClick={() => setShowProviderImport(false)}
              className="btn-secondary mt-6"
            >
              ← Back to PDF / screenshot upload
            </button>
          </>
        )}
      </section>
    </div>
  );
}
