"use client";

import { BookOpen, LayoutDashboard, LifeBuoy, Plus, UserCog } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { RequireRole } from "@/components/layout/RequireRole";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/books", label: "My Books", icon: BookOpen },
  { href: "/tickets", label: "My Tickets", icon: LifeBuoy, exact: true },
  { href: "/tickets/new", label: "New Ticket", icon: Plus },
  { href: "/account", label: "Account", icon: UserCog },
];

export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="author">
      <AppShell nav={NAV} portalLabel="Author Portal">
        {children}
      </AppShell>
    </RequireRole>
  );
}
