import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TaskList } from "@/components/tasks/TaskList";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard");

  const tasks = await prisma.task.findMany({
    where: { clientProfileId: profile.id },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      assignedBy: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Tasks</h1>
        <p className="page-sub">
          Your assigned tasks for credit and funding. Mark in progress or complete when done.
        </p>
      </div>
      <TaskList tasks={tasks} />
    </div>
  );
}
