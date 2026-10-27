"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BookMarked, LogOut, Menu, Wifi, WifiOff, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRealtimeState } from "@/components/providers/RealtimeProvider";
import { cx } from "@/components/ui";
import { BreadcrumbProvider, Breadcrumbs } from "./Breadcrumbs";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export function AppShell({ nav, portalLabel, children }: { nav: NavItem[]; portalLabel: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));

  const navList = (
    <nav aria-label="Main" className="flex flex-col gap-1 px-3">
      {nav.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
            className={cx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2 px-6 py-5">
      <span className="rounded-lg bg-indigo-500 p-1.5 text-white">
        <BookMarked className="size-4" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-white">BookLeaf</p>
        <p className="text-xs text-slate-400">{portalLabel}</p>
      </div>
    </div>
  );

  return (
    <BreadcrumbProvider>
    <div className="min-h-dvh bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-slate-900 lg:flex">
        {brand}
        {navList}
        <SidebarLogout />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-900">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button onClick={() => setMobileOpen(false)} className="rounded-md p-2 text-slate-300 hover:text-white" aria-label="Close navigation">
                <X className="size-5" />
              </button>
            </div>
            {navList}
            <SidebarLogout />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <TopBar nav={nav} onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
    </BreadcrumbProvider>
  );
}

function TopBar({ nav, onMenu }: { nav: NavItem[]; onMenu: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const connection = useRealtimeState();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button onClick={onMenu} className="-ml-1 rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
        <Menu className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <Breadcrumbs nav={nav} />
      </div>
      <span
        className={cx("hidden items-center gap-1.5 text-xs sm:inline-flex", connection === "connected" ? "text-emerald-600" : "text-slate-400")}
        title={connection === "connected" ? "Live updates on" : "Live updates reconnecting…"}
      >
        {connection === "connected" ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
        {connection === "connected" ? "Live" : "Offline"}
      </span>
      <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-medium text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <span className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700" aria-hidden>
          {user?.name?.[0]?.toUpperCase()}
        </span>
        <button
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}

function SidebarLogout() {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <div className="mt-auto border-t border-white/10 p-3">
      <button
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-4 shrink-0" />
        Logout
      </button>
    </div>
  );
}
