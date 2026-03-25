import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClientTabs } from "@/components/admin/ClientTabs";
import { ClientTabOverview } from "@/components/admin/ClientTabOverview";
import { ClientTabDocuments } from "@/components/admin/ClientTabDocuments";
import { ClientTabScores } from "@/components/admin/ClientTabScores";
import { ClientTabDisputes } from "@/components/admin/ClientTabDisputes";
import { ClientTabBilling } from "@/components/admin/ClientTabBilling";
import { ClientTabNotes } from "@/components/admin/ClientTabNotes";
import { ClientTabCommunications } from "@/components/admin/ClientTabCommunications";
import { BUREAUS } from "@/lib/constants";

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  await getServerSession(authOptions);
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = tab && ["overview", "documents", "scores", "disputes", "billing", "notes", "communications"].includes(tab) ? tab : "overview";

  const profile = await prisma.clientProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      negativeItems: true,
      disputeRounds: { include: { items: true }, orderBy: { dateCreated: "desc" } },
      tasks: {
        include: {
          assignedBy: { select: { name: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { dueDate: "asc" },
      },
      applications: true,
      audits: { orderBy: { auditDate: "desc" }, take: 10 },
      documents: true,
      scoreHistory: { orderBy: { recordedAt: "desc" }, take: 30 },
      invoices: { orderBy: { createdAt: "desc" } },
      clientNotes: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!profile) notFound();

  const assignees = await prisma.user.findMany({
    where: { OR: [{ role: "ADMIN" }, { id: profile.userId }] },
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  const bureauCounts = profile.negativeItems.reduce(
    (acc, i) => {
      if (BUREAUS.includes(i.bureau as "Experian" | "Equifax" | "TransUnion")) acc[i.bureau] = (acc[i.bureau] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const bureau = {
    experian: bureauCounts["Experian"] ?? 0,
    equifax: bureauCounts["Equifax"] ?? 0,
    transUnion: bureauCounts["TransUnion"] ?? 0,
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="inline-block text-slate-400 hover:text-white">
        ← Back to clients
      </Link>
      <ClientTabs clientId={id} activeTab={activeTab}>
        {activeTab === "overview" && <ClientTabOverview profile={profile} bureau={bureau} />}
        {activeTab === "documents" && <ClientTabDocuments profile={profile} />}
        {activeTab === "scores" && <ClientTabScores profile={profile} />}
        {activeTab === "disputes" && <ClientTabDisputes profile={profile} />}
        {activeTab === "billing" && <ClientTabBilling profile={profile} />}
        {activeTab === "notes" && <ClientTabNotes profile={{ ...profile, assignees }} />}
        {activeTab === "communications" && <ClientTabCommunications profile={profile} />}
      </ClientTabs>
    </div>
  );
}
