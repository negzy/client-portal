"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminClientPrivateNotes } from "@/components/admin/AdminClientPrivateNotes";

type Assignee = { id: string; name: string | null; email: string; role: string };

type Profile = {
  id: string;
  userId?: string;
  adminNotesCfpb: string | null;
  adminNotesCreditMonitoring: string | null;
  adminNotesEmail: string | null;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    assignedBy: { name: string | null } | null;
    assignedTo: { id: string; name: string | null; email: string } | null;
  }>;
  clientNotes: Array<{ id: string; body: string; createdAt: Date }>;
  assignees?: Assignee[];
};

export function ClientTabNotes({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [sending, setSending] = useState(false);
  const [taskError, setTaskError] = useState("");
  const assignees = profile.assignees ?? [];

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSending(true);
    setTaskError("");
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProfileId: profile.id,
          title: taskTitle.trim(),
          category: "Credit",
          dueDate: taskDue || undefined,
          assignedToId: assignedToId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTaskError(data.error ?? "Could not create task");
        return;
      }
      setTaskTitle("");
      setTaskDue("");
      setAssignedToId("");
      setShowAddTask(false);
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function reassignTask(taskId: string, toId: string) {
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: toId || null }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <AdminClientPrivateNotes
        clientProfileId={profile.id}
        initialCfpb={profile.adminNotesCfpb}
        initialCreditMonitoring={profile.adminNotesCreditMonitoring}
        initialEmail={profile.adminNotesEmail}
      />

      <div className="card-elevated p-6">
        <h2 className="section-heading">Internal notes</h2>
        <p className="section-sub mt-1">General notes on this client file (legacy list)</p>
        {profile.clientNotes.length === 0 ? (
          <p className="mt-4 text-slate-400">No notes yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {profile.clientNotes.map((n) => (
              <li key={n.id} className="rounded-lg border border-surface-border bg-surface-card p-3 text-sm text-slate-300">
                {n.body}
                <p className="mt-1 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card-elevated p-6">
        <h2 className="section-heading">Tasks & reminders</h2>
        <p className="section-sub mt-1">Assign to the client or a team member</p>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          {profile.tasks.slice(0, 20).map((t) => (
            <li key={t.id} className="flex flex-col gap-2 rounded-lg border border-surface-border bg-surface-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {t.title} · {t.status} · {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                {t.assignedTo && (
                  <span className="mt-1 block text-xs text-slate-500">
                    Assigned: {t.assignedTo.name ?? t.assignedTo.email}
                  </span>
                )}
              </span>
              {assignees.length > 0 && (
                <select
                  aria-label={`Reassign ${t.title}`}
                  className="input-field max-w-xs shrink-0 text-xs"
                  value={t.assignedTo?.id ?? ""}
                  onChange={(e) => reassignTask(t.id, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.role === "ADMIN" ? "Admin: " : "Client: "}
                      {a.name ?? a.email}
                    </option>
                  ))}
                </select>
              )}
            </li>
          ))}
        </ul>
        {showAddTask ? (
          <form onSubmit={addTask} className="mt-4 space-y-2 rounded-lg border border-surface-border bg-surface-card p-3">
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" className="input-field" required />
            <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="input-field" />
            {assignees.length > 0 && (
              <div>
                <label className="text-xs text-slate-400">Assign to</label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="input-field mt-1"
                >
                  <option value="">Unassigned</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.role === "ADMIN" ? "Admin: " : "Client: "}
                      {a.name ?? a.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {taskError && <p className="text-sm text-red-400">{taskError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={sending} className="btn-primary">
                Add task
              </button>
              <button type="button" onClick={() => { setShowAddTask(false); setTaskError(""); }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setShowAddTask(true)} className="mt-4 text-orange-400 hover:underline">
            + Add task
          </button>
        )}
        <Link href="/admin/tasks" className="mt-4 inline-block text-orange-400 hover:underline">
          View all tasks →
        </Link>
      </div>
    </div>
  );
}
