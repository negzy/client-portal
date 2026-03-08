import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DashboardNav } from "@/components/DashboardNav";

const ALLOWED_DURING_ONBOARDING = ["/dashboard/credit-import", "/dashboard/vault"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  const role = (session.user as { role?: string }).role;
  if (role === "CLIENT" && profile && !profile.onboardingCompletedAt) {
    const path = (await headers()).get("x-pathname") ?? "";
    const isAllowed = ALLOWED_DURING_ONBOARDING.some((p) => path.startsWith(p));
    if (!isAllowed) redirect("/onboarding");
  }

  const unreadMessagesCount = profile
    ? await prisma.message.count({
        where: {
          recipientId: profile.id,
          readAt: null,
        },
      })
    : 0;

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-surface">
      <aside className="w-full border-b border-surface-border bg-surface-card md:w-64 md:border-b-0 md:border-r md:min-h-screen">
        <div className="sticky top-0 z-10 flex h-16 items-center border-b border-surface-border bg-surface-card/95 px-5 backdrop-blur-sm">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">
              CreditLyft
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Portal</span>
          </Link>
        </div>
        <div className="p-4">
          <DashboardNav unreadMessagesCount={unreadMessagesCount} />
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}
