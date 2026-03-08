import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LetterGenerator } from "@/components/admin/LetterGenerator";

export default async function AdminLettersPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  await getServerSession(authOptions);
  const { clientId } = await searchParams;

  const clients = await prisma.clientProfile.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const selectedClient = clientId
    ? await prisma.clientProfile.findUnique({
        where: { id: clientId },
        include: {
          user: { select: { name: true, email: true } },
          negativeItems: true,
        },
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Letter generator</h1>
        <p className="mt-1 text-slate-400">
          Bureau dispute, MOV, creditor direct dispute, CFPB complaint drafts
        </p>
      </div>
      <LetterGenerator
        clients={clients}
        selectedClient={selectedClient}
      />
    </div>
  );
}
