"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  TrendingUp,
  FileText,
  CreditCard,
  ListTodo,
  MessageSquare,
} from "lucide-react";
import { clsx } from "clsx";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "scores", label: "Scores", icon: TrendingUp },
  { id: "disputes", label: "Disputes", icon: FileText },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notes", label: "Notes & Tasks", icon: ListTodo },
  { id: "communications", label: "Communications", icon: MessageSquare },
] as const;

export function ClientTabs({
  clientId,
  children,
  activeTab,
}: {
  clientId: string;
  children: React.ReactNode;
  activeTab: string;
}) {
  const pathname = usePathname();
  const base = `/admin/clients/${clientId}`;

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-border">
        <nav className="-mb-px flex flex-wrap gap-1" aria-label="Client file tabs">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const href = `${base}?tab=${id}`;
            return (
              <Link
                key={id}
                href={href}
                className={clsx(
                  "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-orange-500 text-orange-400"
                    : "border-transparent text-slate-400 hover:border-surface-border hover:text-slate-200"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
