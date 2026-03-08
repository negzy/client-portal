"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { Task } from "@prisma/client";

type TaskWithCreator = Task & {
  assignedBy: { name: string | null } | null;
};

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-slate-500/30 text-slate-300",
  IN_PROGRESS: "bg-amber-500/30 text-amber-300",
  COMPLETE: "bg-emerald-500/30 text-emerald-300",
  WAITING: "bg-blue-500/30 text-blue-300",
};

const categoryLabels: Record<string, string> = {
  Credit: "Credit",
  Funding: "Funding",
  Docs: "Docs",
  BankSetup: "Bank setup",
  Applications: "Applications",
  Internal: "Internal",
};

export function TaskList({ tasks }: { tasks: TaskWithCreator[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(taskId: string, status: string) {
    setUpdating(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setUpdating(null);
    }
  }

  if (!tasks.length) {
    return (
      <div className="card text-center text-slate-400">
        No tasks assigned yet. Your admin will add tasks as you progress.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3 className="font-medium text-white">{task.title}</h3>
            {task.description && (
              <p className="mt-1 text-sm text-slate-400">{task.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={clsx(
                  "rounded px-2 py-0.5 text-xs",
                  statusColors[task.status] ?? "bg-slate-500/30"
                )}
              >
                {task.status.replace("_", " ")}
              </span>
              <span className="rounded bg-surface px-2 py-0.5 text-xs text-slate-400">
                {categoryLabels[task.category] ?? task.category}
              </span>
              {task.assignedBy?.name && (
                <span className="text-xs text-slate-500">
                  Assigned by {task.assignedBy.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="text-sm text-slate-400">
              {task.dueDate
                ? `Due ${new Date(task.dueDate).toLocaleDateString()}`
                : "No due date"}
            </div>
            {task.status !== "COMPLETE" && (
              <div className="flex flex-wrap gap-2">
                {task.status === "NOT_STARTED" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(task.id, "IN_PROGRESS")}
                    disabled={updating === task.id}
                    className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    {updating === task.id ? "Updating…" : "Mark in progress"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => updateStatus(task.id, "COMPLETE")}
                  disabled={updating === task.id}
                  className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {updating === task.id ? "Updating…" : "Mark complete"}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
