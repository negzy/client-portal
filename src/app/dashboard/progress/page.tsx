import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProgressPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard");

  const negativeItems = await prisma.negativeItem.findMany({
    where: { clientProfileId: profile.id },
    orderBy: { dateImported: "desc" },
    include: {
      disputeRounds: { include: { disputeRound: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Credit & progress</h1>
        <p className="page-sub">
          Your credit repair and capital access status
        </p>
      </div>

      <section className="card-elevated">
        <h2 className="section-heading">Negative items</h2>
        <p className="section-sub">
          {negativeItems.length} item(s) on file. Status, round, and letter dates from your dispute workflow.
        </p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card text-left text-slate-400">
                <th className="pb-2 pl-4 pr-4">Account</th>
                <th className="pb-2 pr-4">Bureau</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Round</th>
                <th className="pb-2 pr-4">Letters sent</th>
                <th className="pb-2 pr-4">Imported</th>
              </tr>
            </thead>
            <tbody>
              {negativeItems.map((item) => {
                const rounds = [...item.disputeRounds].sort(
                  (a, b) =>
                    new Date(b.disputeRound.dateCreated).getTime() -
                    new Date(a.disputeRound.dateCreated).getTime()
                );
                const latestRound = rounds[0]?.disputeRound;
                const lettersSent = item.disputeRounds.some(
                  (dr) => dr.disputeRound.dateSent != null
                );
                const roundNum = item.disputeRound ?? latestRound?.roundNumber;
                const roundLabel = roundNum != null
                  ? `Round ${roundNum}${latestRound ? ` (${latestRound.roundType})` : ""}`
                  : "—";
                return (
                  <tr
                    key={item.id}
                    className="border-b border-surface-border/50 text-slate-300"
                  >
                    <td className="py-3 pl-4 pr-4">{item.accountName}</td>
                    <td className="py-3 pr-4">{item.bureau}</td>
                    <td className="py-3 pr-4">{item.accountType ?? "—"}</td>
                    <td className="py-3 pr-4">{item.currentOutcome ?? "Pending"}</td>
                    <td className="py-3 pr-4">{roundLabel}</td>
                    <td className="py-3 pr-4">
                      {lettersSent ? (
                        latestRound?.dateSent ? (
                          new Date(latestRound.dateSent).toLocaleDateString()
                        ) : (
                          "Yes"
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {item.dateImported.toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
