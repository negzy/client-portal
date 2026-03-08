import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  const fullName = user?.name ?? "";
  const [firstName, ...lastParts] = fullName.split(" ");
  const lastName = lastParts.join(" ") || "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="page-sub">
          Update your contact and business information
        </p>
      </div>

      <ProfileForm
        clientProfileId={profile.id}
        initial={{
          firstName: profile?.firstName ?? firstName,
          lastName: profile?.lastName ?? lastName,
          email: user?.email ?? "",
          phone: profile?.phone ?? "",
          address: profile?.address ?? "",
          city: profile?.city ?? "",
          state: profile?.state ?? "",
          zip: profile?.zip ?? "",
          dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10) ?? "",
          businessName: profile?.businessName ?? "",
          businessEntityType: profile?.businessEntityType ?? "",
          llcState: profile?.llcState ?? "",
          ein: profile?.ein ?? "",
          preferredContactMethod: profile?.preferredContactMethod ?? "",
        }}
      />

      <ChangePasswordForm />
    </div>
  );
}
