import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const profile = session?.user?.id
    ? await prisma.clientProfile.findUnique({
        where: { userId: session.user.id },
        select: { onboardingCompletedAt: true },
      })
    : null;
  const reviewMode = !!profile?.onboardingCompletedAt;

  return <OnboardingFlow reviewMode={reviewMode} />;
}
