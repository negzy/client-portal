"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  user: { name: string | null; email: string };
};

type NegativeItem = {
  id: string;
  accountName: string;
  bureau: string;
  negativeReason: string | null;
};

type SelectedClient = {
  id: string;
  user: { name: string | null; email: string };
  negativeItems: NegativeItem[];
};

const LETTER_TYPES = [
  { value: "bureau", label: "Bureau dispute letter" },
  { value: "mov", label: "Method of verification" },
  { value: "creditor", label: "Creditor direct dispute" },
  { value: "cfpb", label: "CFPB complaint draft" },
] as const;

export function LetterGenerator({
  clients,
  selectedClient,
}: {
  clients: Client[];
  selectedClient: SelectedClient | null;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(selectedClient?.id ?? "");
  const [letterType, setLetterType] = useState<typeof LETTER_TYPES[number]["value"]>("bureau");
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const client = clientId ? clients.find((c) => c.id === clientId) : null;
  const items = selectedClient?.negativeItems ?? [];

  function toggleItem(id: string) {
    setItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function generate() {
    if (!clientId || !letterType) return;
    setLoading(true);
    setPdfUrl(null);
    try {
      const res = await fetch("/api/admin/letters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          letterType,
          negativeItemIds: itemIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.pdfUrl) setPdfUrl(data.pdfUrl);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-6">
      <div>
        <label className="label">Client</label>
        <select
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            router.push(
              e.target.value ? `/admin/letters?clientId=${e.target.value}` : "/admin/letters"
            );
          }}
          className="input-field"
        >
          <option value="">Select client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.user.name ?? c.user.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Letter type</label>
        <select
          value={letterType}
          onChange={(e) =>
            setLetterType(e.target.value as typeof letterType)
          }
          className="input-field"
        >
          {LETTER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {selectedClient && items.length > 0 && (
        <div>
          <label className="label">Include negative items</label>
          <ul className="mt-2 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={itemIds.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                />
                <span className="text-slate-300">
                  {item.accountName} · {item.bureau}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading || !clientId}
        className="btn-primary"
      >
        {loading ? "Generating…" : "Generate PDF"}
      </button>

      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-brand-400 hover:underline"
        >
          Download letter PDF →
        </a>
      )}
    </div>
  );
}
