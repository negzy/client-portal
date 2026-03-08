import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as { role?: string }).role;
  if (role === "ADMIN") redirect("/admin");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  // Allow completed clients to view /onboarding in "review" mode (no redirect)

  return <>{children}</>;
}
