import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const activityLabels: Record<string, string> = {
  REPORT_IMPORTED: "Report imported",
  AUDIT_GENERATED: "Audit generated",
  NEGATIVE_ITEMS_FOUND: "Negative items found",
  ROUND_SENT: "Round sent",
  BUREAU_RESPONDED: "Bureau responded",
  ACCOUNT_REMOVED: "Account removed",
  FUNDING_TASK_ASSIGNED: "Funding task assigned",
  APPLICATION_SUBMITTED: "Application submitted",
  APPROVAL_RECEIVED: "Approval received",
  DENIAL_RECEIVED: "Denial received",
  TASK_COMPLETED: "Task completed",
  DOCUMENT_UPLOADED: "Document uploaded",
  OTHER: "Activity",
};

export default async function TimelinePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard");

  const activities = await prisma.timelineActivity.findMany({
    where: { clientProfileId: profile.id },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Timeline</h1>
        <p className="page-sub">
          Key actions and events in chronological order
        </p>
      </div>

      {!activities.length ? (
        <div className="card-elevated py-12 text-center text-slate-400">
          No activity yet. Import a credit report or complete tasks to see events here.
        </div>
      ) : (
        <div className="space-y-0">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-4 border-b border-surface-border py-5 last:border-0"
            >
              <div className="flex shrink-0 flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-brand-500 shadow-glow-sm" />
                {activity.id !== activities[activities.length - 1]?.id && (
                  <div className="mt-1 h-full w-px bg-surface-border" />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-4">
                <p className="font-medium text-white">
                  {activityLabels[activity.activityType] ?? activity.title}
                </p>
                {activity.description && (
                  <p className="mt-1 text-sm text-slate-400">
                    {activity.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {formatDistanceToNow(new Date(activity.occurredAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
