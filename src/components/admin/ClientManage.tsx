"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  user: { name: string | null; email: string };
  processStage?: string | null;
  negativeItems: Array<{
    id: string;
    accountName: string;
    bureau: string;
    currentOutcome: string | null;
  }>;
  disputeRounds: Array<{
    id: string;
    roundType: string;
    roundNumber: number;
    dateSent: Date | null;
    outcome: string | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    assignedBy: { name: string | null } | null;
  }>;
  applications: Array<{
    id: string;
    bankName: string;
    productName: string;
    status: string;
  }>;
  audits: Array<{ id: string; auditDate: Date }>;
};

export function ClientManage({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("Credit");
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
          category: taskCategory,
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
      <div className="card">
        <h1 className="text-xl font-bold text-white">
          {profile.user.name ?? profile.user.email}
        </h1>
        <p className="text-slate-400">{profile.user.email}</p>
        <div className="mt-4 flex gap-4">
          <div>
            <p className="text-sm text-slate-400">Stage</p>
            <p className="text-lg font-semibold text-white">
              {profile.processStage ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold text-white">Negative items</h2>
        <p className="text-sm text-slate-400">{profile.negativeItems.length} items</p>
        <ul className="mt-2 space-y-1">
          {profile.negativeItems.slice(0, 10).map((item) => (
            <li key={item.id} className="text-sm text-slate-300">
              {item.accountName} · {item.bureau} · {item.currentOutcome ?? "—"}
            </li>
          ))}
        </ul>
        <Link
          href={`/admin/clients/${profile.id}/disputes`}
          className="mt-2 inline-block text-brand-400 hover:underline"
        >
          Manage disputes →
        </Link>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-white">Dispute rounds</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {profile.disputeRounds.slice(0, 5).map((r) => (
            <li key={r.id}>
              Round {r.roundNumber} · {r.roundType} ·{" "}
              {r.dateSent ? r.dateSent.toLocaleDateString() : "Not sent"} ·{" "}
              {r.outcome ?? "—"}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-white">Tasks</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {profile.tasks.slice(0, 5).map((t) => (
            <li key={t.id}>
              {t.title} · {t.status} ·{" "}
              {t.dueDate ? t.dueDate.toLocaleDateString() : "—"}
            </li>
          ))}
        </ul>
        {showAddTask ? (
          <form onSubmit={addTask} className="mt-4 space-y-2 rounded border border-surface-border bg-surface p-3">
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              className="input-field"
              required
            />
            <select
              value={taskCategory}
              onChange={(e) => setTaskCategory(e.target.value)}
              className="input-field"
            >
              <option value="Credit">Credit</option>
              <option value="Funding">Funding</option>
              <option value="Docs">Docs</option>
              <option value="BankSetup">Bank setup</option>
              <option value="Applications">Applications</option>
              <option value="Internal">Internal</option>
            </select>
            <input
              type="date"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
              className="input-field"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={sending} className="btn-primary">
                {sending ? "Adding…" : "Add task"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddTask(true)}
            className="mt-2 text-brand-400 hover:underline"
          >
            + Add task
          </button>
        )}
        <Link
          href={`/admin/clients/${profile.id}/tasks`}
          className="mt-2 ml-4 inline-block text-brand-400 hover:underline"
        >
          Manage tasks →
        </Link>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-white">Applications</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {profile.applications.slice(0, 5).map((a) => (
            <li key={a.id}>
              {a.bankName} · {a.productName} · {a.status}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-2">
        <Link
          href={`/admin/letters?clientId=${profile.id}`}
          className="btn-primary"
        >
          Generate letter
        </Link>
        <Link
          href={`/admin/messages?clientId=${profile.id}`}
          className="btn-secondary"
        >
          Message client
        </Link>
      </div>
    </div>
  );
}
