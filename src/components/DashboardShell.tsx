"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function DashboardShell({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-surface">
      {/* Mobile: menu button */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-surface-border bg-surface-card px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-surface-border hover:text-white"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <span className="text-lg font-bold tracking-tight text-white">CreditLyft</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Portal</span>
        </Link>
        <div className="w-10" />
      </div>

      {/* Sidebar: hidden on mobile unless open, fixed overlay */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-20 w-64 border-r border-surface-border bg-surface-card
          transform transition-transform duration-200 ease-out md:relative md:transform-none
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex h-full flex-col pt-14 md:pt-0">
          <div className="hidden border-b border-surface-border px-5 py-4 md:block">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">CreditLyft</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Portal</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">{sidebar}</div>
        </div>
      </aside>

      {/* Backdrop when menu open on mobile */}
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      <main className="flex-1 overflow-auto p-6 md:p-8 lg:p-10 pt-14 md:pt-0 min-h-screen">{children}</main>
    </div>
  );
}
