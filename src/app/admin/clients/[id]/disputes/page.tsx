import { redirect } from "next/navigation";

export default async function LegacyClientDisputesRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/clients/${id}?tab=disputes`);
}

