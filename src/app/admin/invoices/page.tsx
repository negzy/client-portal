import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminInvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/login");
  }

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      clientProfile: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Invoices</h1>
        <p className="page-sub">Client billing (optional — add Stripe for payments)</p>
      </div>
      <div className="card-elevated overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No invoices yet. Invoices can be created from client pages when billing is enabled.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="p-4 font-semibold text-white">Client</th>
                <th className="p-4 font-semibold text-white">Amount</th>
                <th className="p-4 font-semibold text-white">Status</th>
                <th className="p-4 font-semibold text-white">Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-surface-border/50">
                  <td className="p-4">
                    <Link
                      href={`/admin/clients/${inv.clientProfileId}`}
                      className="text-orange-400 hover:underline"
                    >
                      {inv.clientProfile.user.name ?? inv.clientProfile.user.email}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-300">
                    ${(inv.amountCents / 100).toFixed(2)} {inv.currency}
                  </td>
                  <td className="p-4">
                    <span
                      className={
                        inv.status === "paid"
                          ? "text-emerald-400"
                          : inv.status === "overdue"
                            ? "text-red-400"
                            : "text-slate-400"
                      }
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
