import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminClientsPage() {
  await getServerSession(authOptions);

  const clients = await prisma.clientProfile.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { negativeItems: true, tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Clients</h1>
        <p className="mt-2 text-slate-400">
          Search and filter by stage, dispute round
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-card text-left text-slate-400">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Stage</th>
              <th className="pb-2 pr-4">Negative items</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                className="border-b border-surface-border/50 text-slate-300"
              >
                <td className="py-3 pr-4">{c.user.name ?? "—"}</td>
                <td className="py-3 pr-4">{c.user.email}</td>
                <td className="py-3 pr-4">
                  {c.processStage ?? "—"}
                </td>
                <td className="py-3 pr-4">{c._count.negativeItems}</td>
                <td className="py-3">
                  <Link
                    href={`/admin/clients/${c.id}`}
                    className="text-brand-400 hover:underline"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
