import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MessageThread } from "@/components/messages/MessageThread";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard");

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { recipientId: profile.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { name: true, id: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Messages</h1>
        <p className="page-sub">
          Conversation with your admin / support
        </p>
      </div>
      <MessageThread
        messages={messages}
        currentUserId={session.user.id}
        clientProfileId={profile.id}
      />
    </div>
  );
}
