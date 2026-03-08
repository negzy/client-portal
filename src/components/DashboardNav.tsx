"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileInput,
  Target,
  ListTodo,
  Building2,
  FileText,
  FolderOpen,
  MessageSquare,
  Activity,
  User,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";

const clientNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/credit-import", label: "Credit Import", icon: FileInput },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListTodo },
  { href: "/dashboard/progress", label: "Progress", icon: Target },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/agreement", label: "Agreement", icon: FileText },
  { href: "/dashboard/applications", label: "Applications", icon: Building2 },
  { href: "/dashboard/vault", label: "Document Vault", icon: FolderOpen },
  { href: "/dashboard/scripts", label: "Scripts & Guidance", icon: FileText },
  { href: "/dashboard/timeline", label: "Timeline", icon: Activity },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function DashboardNav({ unreadMessagesCount = 0 }: { unreadMessagesCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {clientNav.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        const showUnread = href === "/dashboard/messages" && unreadMessagesCount > 0;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "border-brand-500 bg-brand-500/15 text-brand-400"
                : "border-transparent text-text-secondary hover:bg-surface-border/40 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {showUnread && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-semibold text-white">
                {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
              </span>
            )}
          </Link>
        );
      })}
      <div className="my-2 border-t border-surface-border" />
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-surface-border/40 hover:text-slate-200"
      >
        <LogOut className="h-5 w-5" />
        Sign out
      </button>
    </nav>
  );
}
