import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-surface">
      <aside className="w-full border-b border-surface-border bg-surface-card md:w-64 md:border-b-0 md:border-r md:min-h-screen">
        <div className="sticky top-0 z-10 flex h-16 items-center border-b border-surface-border bg-surface-card/95 px-5 backdrop-blur-sm">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">
              CreditLyft
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Admin</span>
          </Link>
        </div>
        <div className="p-4">
          <AdminNav />
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}
