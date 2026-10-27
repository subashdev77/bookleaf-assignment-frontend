"use client";

import { Inbox, LayoutDashboard, UserCog, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/layout/RequireRole";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/authors", label: "Author Management", icon: Users },
  { href: "/admin/tickets", label: "Ticket Management", icon: Inbox },
  { href: "/admin/account", label: "Account", icon: UserCog },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <AppShell nav={NAV} portalLabel="Support Operations">
        {children}
      </AppShell>
    </RequireRole>
  );
}
