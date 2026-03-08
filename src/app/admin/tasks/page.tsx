import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminTasksPage() {
  await getServerSession(authOptions);

  const tasks = await prisma.task.findMany({
    where: { status: { in: ["NOT_STARTED", "IN_PROGRESS", "WAITING"] } },
    include: {
      clientProfile: {
        include: { user: { select: { name: true, email: true } } },
      },
      assignedBy: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Tasks</h1>
        <p className="mt-2 text-slate-400">
          Assign and manage client and internal tasks
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-card text-left text-slate-400">
              <th className="pb-2 pr-4">Client</th>
              <th className="pb-2 pr-4">Task</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Due</th>
              <th className="pb-2">Assigned by</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr
                key={t.id}
                className="border-b border-surface-border/50 text-slate-300"
              >
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/clients/${t.clientProfileId}`}
                    className="text-brand-400 hover:underline"
                  >
                    {t.clientProfile.user.name ?? t.clientProfile.user.email}
                  </Link>
                </td>
                <td className="py-3 pr-4">{t.title}</td>
                <td className="py-3 pr-4">{t.status}</td>
                <td className="py-3 pr-4">
                  {t.dueDate ? t.dueDate.toLocaleDateString() : "—"}
                </td>
                <td className="py-3">{t.assignedBy?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
