import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminMessageForm } from "@/components/admin/AdminMessageForm";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { clientId } = await searchParams;
  const currentUserId = session?.user?.id ?? "";

  const clientsWithMessages = await prisma.clientProfile.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const selectedClient = clientId
    ? await prisma.clientProfile.findUnique({
        where: { id: clientId },
        include: {
          user: { select: { name: true, email: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { name: true, id: true } } },
          },
        },
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="mt-1 text-slate-400">
          Client conversations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="card">
          <h2 className="text-sm font-medium text-slate-400">Clients</h2>
          <ul className="mt-2 space-y-1">
            {clientsWithMessages.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/messages?clientId=${c.id}`}
                  className={`block rounded px-2 py-1.5 text-sm ${
                    clientId === c.id
                      ? "bg-brand-500/20 text-brand-300"
                      : "text-slate-300 hover:bg-surface-border/50"
                  }`}
                >
                  {c.user.name ?? c.user.email}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          {selectedClient ? (
            <>
              <h2 className="font-semibold text-white">
                {selectedClient.user.name ?? selectedClient.user.email}
              </h2>
              <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto">
                {selectedClient.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg p-3 ${
                      m.senderId === currentUserId
                        ? "ml-0 bg-brand-500/20"
                        : "mr-0 ml-auto bg-surface border border-surface-border"
                    }`}
                  >
                    <p className="text-xs text-slate-500">{m.sender.name ?? "User"}</p>
                    <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {m.createdAt.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <AdminMessageForm clientProfileId={selectedClient.id} />
            </>
          ) : (
            <p className="text-slate-400">Select a client to view messages.</p>
          )}
        </div>
      </div>
    </div>
  );
}
