"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Mail,
  Building2,
  ListTodo,
  MessageSquare,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
  StickyNote,
} from "lucide-react";
import { clsx } from "clsx";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/disputes", label: "Disputes", icon: FileText },
  { href: "/admin/tasks", label: "Tasks", icon: ListTodo },
  { href: "/admin/applications", label: "Applications", icon: Building2 },
  { href: "/admin/documents", label: "Documents", icon: FolderOpen },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/letters", label: "Letter generator", icon: Mail },
  { href: "/admin/letter-templates", label: "Letter templates", icon: FileText },
  { href: "/admin/bank-matrix", label: "Bank matrix", icon: Building2 },
  { href: "/admin/affiliates", label: "Affiliates", icon: Users },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/poa", label: "POA", icon: FileText },
  { href: "/admin/notes", label: "Credentials & notes", icon: StickyNote },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {adminNav.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "border-brand-500 bg-brand-500/15 text-brand-400"
                : "border-transparent text-slate-400 hover:bg-surface-border/40 hover:text-slate-200"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
      <div className="my-2 border-t border-surface-border" />
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-surface-border/40 hover:text-slate-200"
      >
        <LogOut className="h-5 w-5" />
        Sign out
      </button>
    </nav>
  );
}
