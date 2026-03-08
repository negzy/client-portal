import Link from "next/link";

type Doc = { id: string; category: string; fileName: string; uploadedAt: Date };

export function ClientTabDocuments({ profile }: { profile: { id: string; documents: Doc[] } }) {
  return (
    <div className="card-elevated p-6">
      <h2 className="section-heading">Documents</h2>
      <p className="section-sub mt-1">Required documents checklist and uploads</p>
      {profile.documents.length === 0 ? (
        <p className="mt-4 text-slate-400">No documents yet. Client can upload from their Document Vault.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {profile.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-card px-4 py-2 text-sm text-slate-300">
              <span>{d.fileName}</span>
              <span className="text-slate-500">{d.category} · {new Date(d.uploadedAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/admin/documents" className="mt-4 inline-block text-orange-400 hover:underline">
        View all documents →
      </Link>
    </div>
  );
}
