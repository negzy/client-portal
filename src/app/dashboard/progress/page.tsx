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
          {negativeItems.length} item(s) on file
        </p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card text-left text-slate-400">
                <th className="pb-2 pl-4 pr-4">Account</th>
                <th className="pb-2 pr-4">Bureau</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Outcome</th>
                <th className="pb-2 pr-4">Imported</th>
              </tr>
            </thead>
            <tbody>
              {negativeItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-surface-border/50 text-slate-300"
                >
                  <td className="py-3 pl-4 pr-4">{item.accountName}</td>
                  <td className="py-3 pr-4">{item.bureau}</td>
                  <td className="py-3 pr-4">{item.accountType ?? "—"}</td>
                  <td className="py-3 pr-4">{item.currentOutcome ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {item.dateImported.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
