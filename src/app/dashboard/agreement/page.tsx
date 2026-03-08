import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgreementSignForm } from "./AgreementSignForm";

export default async function AgreementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard");

  if (profile.agreementSignedAt) {
    return (
      <div className="mx-auto max-w-lg space-y-6 p-6">
        <h1 className="page-title">Agreement</h1>
        <div className="card-elevated p-6">
          <p className="text-slate-300">
            You signed the client agreement on{" "}
            {new Date(profile.agreementSignedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="page-title">Agreement</h1>
      <p className="page-sub">Please read and sign to continue.</p>
      <div className="card-elevated p-6">
        <div className="prose prose-invert max-w-none text-sm text-slate-300">
          <h2 className="text-white">Engagement Agreement</h2>
          <p>
            This agreement is between you and CreditLyft (the &quot;Company&quot;) for credit repair and
            funding readiness services. By signing below you agree to the terms of service, fee
            structure (if any) as communicated, and consent to electronic communications and
            document storage.
          </p>
          <p>
            The Company will assist with credit report review, dispute preparation, and guidance
            toward funding readiness. You agree to provide accurate information and required
            documents in a timely manner.
          </p>
        </div>
        <AgreementSignForm clientProfileId={profile.id} />
      </div>
    </div>
  );
}
