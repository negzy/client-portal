import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminNotesClient } from "./AdminNotesClient";

const DEFAULT_KEYS = [
  { key: "CFPB", label: "CFPB details" },
  { key: "FTC", label: "FTC details" },
  { key: "GENERAL", label: "General credentials / notes" },
];

export default async function AdminNotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const notes = await prisma.adminNote.findMany({ orderBy: { key: "asc" } });
  const byKey = new Map(notes.map((n) => [n.key, n]));
  const initialNotes = DEFAULT_KEYS.map(({ key, label }) => ({
    key,
    label,
    content: byKey.get(key)?.content ?? "",
    updatedAt: byKey.get(key)?.updatedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Credentials & notes</h1>
        <p className="mt-2 text-slate-400">
          VA-only: CFPB, FTC, and other credentials. Not visible to clients.
        </p>
      </div>
      <AdminNotesClient initialNotes={initialNotes} />
    </div>
  );
}
