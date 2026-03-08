"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AgreementSignForm({ clientProfileId }: { clientProfileId: string }) {
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSign() {
    if (!agree) return;
    setLoading(true);
    try {
      const res = await fetch("/api/agreement/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientProfileId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Failed to sign");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 border-t border-surface-border pt-6">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="h-4 w-4 rounded border-surface-border"
        />
        <span className="text-sm text-slate-300">
          I have read and agree to the terms above. I consent to electronic signature.
        </span>
      </label>
      <button
        type="button"
        onClick={handleSign}
        disabled={!agree || loading}
        className="mt-6 btn-primary"
      >
        {loading ? "Signing…" : "Sign agreement"}
      </button>
    </div>
  );
}
