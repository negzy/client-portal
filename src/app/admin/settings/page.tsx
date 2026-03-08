import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminSettingsPage() {
  await getServerSession(authOptions);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-2 text-slate-400">
          Admin and platform settings
        </p>
      </div>

      <div className="card-elevated">
        <h2 className="section-heading">General</h2>
        <p className="section-sub">Configure defaults and preferences</p>
        <p className="mt-4 text-slate-500">
          Settings options will be available in a future update.
        </p>
      </div>
    </div>
  );
}
