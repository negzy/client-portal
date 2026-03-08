"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    assignedBy: { name: string | null } | null;
  }>;
  clientNotes: Array<{ id: string; body: string; createdAt: Date }>;
};

export function ClientTabNotes({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [sending, setSending] = useState(false);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientProfileId: profile.id,
          title: taskTitle.trim(),
          category: "Credit",
          dueDate: taskDue || undefined,
        }),
      });
      if (res.ok) {
        setTaskTitle("");
        setTaskDue("");
        setShowAddTask(false);
        router.refresh();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <h2 className="section-heading">Internal notes</h2>
        <p className="section-sub mt-1">Notes on this client file</p>
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
        <p className="section-sub mt-1">Assign and track tasks</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {profile.tasks.slice(0, 10).map((t) => (
            <li key={t.id}>{t.title} · {t.status} · {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}</li>
          ))}
        </ul>
        {showAddTask ? (
          <form onSubmit={addTask} className="mt-4 space-y-2 rounded-lg border border-surface-border bg-surface-card p-3">
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" className="input-field" required />
            <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="input-field" />
            <div className="flex gap-2">
              <button type="submit" disabled={sending} className="btn-primary">Add task</button>
              <button type="button" onClick={() => setShowAddTask(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setShowAddTask(true)} className="mt-4 text-orange-400 hover:underline">+ Add task</button>
        )}
        <Link href="/admin/tasks" className="mt-4 inline-block text-orange-400 hover:underline">View all tasks →</Link>
      </div>
    </div>
  );
}
