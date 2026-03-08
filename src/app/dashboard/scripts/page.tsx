import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ScriptsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const scripts = await prisma.script.findMany({
    where: { isActive: true },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Scripts & guidance</h1>
        <p className="page-sub">
          Bank call scripts, reconsideration scripts, and setup instructions
        </p>
      </div>

      {!scripts.length ? (
        <div className="card-elevated py-12 text-center text-slate-400">
          No scripts or guidance added yet. Your admin will add them as needed.
        </div>
      ) : (
        <div className="space-y-4">
          {scripts.map((script) => (
            <div key={script.id} className="card-elevated">
              <h2 className="section-heading">{script.title}</h2>
              {script.category && (
                <p className="mt-1 text-xs text-slate-500 uppercase tracking-wider">{script.category}</p>
              )}
              <div className="mt-4 whitespace-pre-wrap rounded-xl border border-surface-border bg-surface-card p-5 text-sm text-slate-300">
                {script.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
