import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddAffiliateForm } from "./AddAffiliateForm";

export default async function AdminAffiliatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/login");
  }

  const affiliates = await prisma.affiliate.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { referrals: true, contacts: true } } },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Affiliates</h1>
          <p className="page-sub">Manage affiliates and referral codes</p>
        </div>
        <AddAffiliateForm />
      </div>
      <div className="card-elevated overflow-hidden">
        {affiliates.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No affiliates yet. Add affiliates to track referrals and payouts.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="p-4 font-semibold text-white">Name</th>
                <th className="p-4 font-semibold text-white">Email</th>
                <th className="p-4 font-semibold text-white">Code</th>
                <th className="p-4 font-semibold text-white">Leads</th>
                <th className="p-4 font-semibold text-white">Referrals</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <tr key={a.id} className="border-b border-surface-border/50">
                  <td className="p-4">{a.name}</td>
                  <td className="p-4 text-slate-300">{a.email}</td>
                  <td className="p-4">
                    <code className="rounded bg-white/10 px-2 py-0.5 text-orange-400">{a.code}</code>
                  </td>
                  <td className="p-4 text-slate-400">{a._count.contacts}</td>
                  <td className="p-4 text-slate-400">{a._count.referrals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-sm text-slate-500">
        Use referral code in lead form (<code className="rounded bg-white/10 px-1">affiliateCode</code>) to attribute leads.
      </p>
    </div>
  );
}
