import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/DashboardNav";
import { PortalTour } from "@/components/PortalTour";
import { DashboardShell } from "@/components/DashboardShell";

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
    <DashboardShell
      sidebar={
        <>
          <PortalTour />
          <DashboardNav unreadMessagesCount={unreadMessagesCount} />
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
