import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const roundLabels: Record<string, string> = {
  ROUND_1_BUREAU: "Round 1: Bureau",
  ROUND_2_MOV: "Round 2: MOV",
  ROUND_3_CREDITOR: "Round 3: Creditor",
  ROUND_4_CFPB: "Round 4: CFPB",
};

export default async function AdminDisputesPage() {
  await getServerSession(authOptions);

  const rounds = await prisma.disputeRound.findMany({
    include: {
      clientProfile: {
        include: { user: { select: { name: true, email: true } } },
      },
      items: { include: { negativeItem: true } },
    },
    orderBy: { dateCreated: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dispute tracker</h1>
        <p className="mt-2 text-slate-400">
          Round 1: Bureau · Round 2: MOV · Round 3: Creditor · Round 4: CFPB
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-card text-left text-slate-400">
              <th className="pb-2 pr-4">Client</th>
              <th className="pb-2 pr-4">Round</th>
              <th className="pb-2 pr-4">Bureau</th>
              <th className="pb-2 pr-4">Date sent</th>
              <th className="pb-2 pr-4">Outcome</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((r) => (
              <tr
                key={r.id}
                className="border-b border-surface-border/50 text-slate-300"
              >
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/clients/${r.clientProfileId}`}
                    className="text-brand-400 hover:underline"
                  >
                    {r.clientProfile.user.name ?? r.clientProfile.user.email}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  {roundLabels[r.roundType] ?? r.roundType}
                </td>
                <td className="py-3 pr-4">{r.bureau ?? "—"}</td>
                <td className="py-3 pr-4">
                  {r.dateSent ? r.dateSent.toLocaleDateString() : "—"}
                </td>
                <td className="py-3 pr-4">{r.outcome ?? "—"}</td>
                <td className="py-3">
                  <Link
                    href={`/admin/clients/${r.clientProfileId}/disputes?round=${r.id}`}
                    className="text-brand-400 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rounds.length === 0 && (
        <p className="text-slate-400">No dispute rounds yet.</p>
      )}
    </div>
  );
}
