"use client";

import { useState } from "react";
import { CreditImportForm } from "@/components/credit-import/CreditImportForm";
import { ManualUploadForm } from "@/components/credit-import/ManualUploadForm";
import { Shield } from "lucide-react";

const PROVIDERS = [
  { value: "MyFreeScoreNow", label: "MyFreeScoreNow" },
  { value: "IdentityIQ", label: "IdentityIQ" },
  { value: "SmartCredit", label: "SmartCredit" },
  { value: "MyScoreIQ", label: "MyScoreIQ" },
] as const;

export default function CreditImportPage() {
  const [showProviderImport, setShowProviderImport] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Import your credit report</h1>
        <p className="page-sub">
          Upload a PDF or screenshot of your report — we’ll read your scores when possible. You can also enter scores manually.
        </p>
      </div>

      {!showProviderImport ? (
        <>
          <ManualUploadForm />
          <div className="card-elevated border-dashed p-6">
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
          <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-card">
            <p className="mb-4 flex items-center gap-2 text-sm text-slate-400">
              <Shield className="h-4 w-4 text-brand-500" />
              Secure encrypted import · Your credentials are used only for report retrieval
            </p>
            <CreditImportForm providers={PROVIDERS} />
          </div>
          <button
            type="button"
            onClick={() => setShowProviderImport(false)}
            className="btn-secondary"
          >
            ← Back to PDF / screenshot upload
          </button>
        </>
      )}
    </div>
  );
}
