import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminPOAPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/login");
  }

  const requests = await prisma.pOARequest.findMany({
    orderBy: { requestedAt: "desc" },
    include: {
      clientProfile: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">POA requests</h1>
        <p className="page-sub">Power of Attorney — optional notarization flow</p>
      </div>
      <div className="card-elevated overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No POA requests yet. Request POA from a client file when needed.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="p-4 font-semibold text-white">Client</th>
                <th className="p-4 font-semibold text-white">Status</th>
                <th className="p-4 font-semibold text-white">Requested</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-surface-border/50">
                  <td className="p-4">
                    <Link
                      href={`/admin/clients/${r.clientProfileId}`}
                      className="text-orange-400 hover:underline"
                    >
                      {r.clientProfile.user.name ?? r.clientProfile.user.email}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-300">{r.status}</td>
                  <td className="p-4 text-slate-400">
                    {new Date(r.requestedAt).toLocaleDateString()}
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
