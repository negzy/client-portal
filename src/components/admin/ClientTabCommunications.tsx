import Link from "next/link";

export function ClientTabCommunications({ profile }: { profile: { id: string; user: { name: string | null; email: string } } }) {
  return (
    <div className="card-elevated p-6">
      <h2 className="section-heading">Communications</h2>
      <p className="section-sub mt-1">Email, portal messages</p>
      <div className="mt-6 space-y-4">
        <p className="text-slate-400">Contact: {profile.user.email}</p>
        <Link href={`/admin/messages?clientId=${profile.id}`} className="btn-primary inline-block">
          Message client
        </Link>
        <p className="text-sm text-slate-500">Client receives an email when you send a message. Use the Messages page for full thread.</p>
      </div>
    </div>
  );
}
