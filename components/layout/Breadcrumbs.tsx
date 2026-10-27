"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { NavItem } from "./AppShell";

interface Crumb {
  label: string;
  href?: string;
}

const CrumbContext = createContext<{ detail: string | null; setDetail: (label: string | null) => void }>({
  detail: null,
  setDetail: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [detail, setDetail] = useState<string | null>(null);
  return <CrumbContext.Provider value={{ detail, setDetail }}>{children}</CrumbContext.Provider>;
}

export function usePageCrumb(label: string | null | undefined) {
  const { setDetail } = useContext(CrumbContext);
  useEffect(() => {
    setDetail(label || null);
    return () => setDetail(null);
  }, [label, setDetail]);
}

function buildTrail(pathname: string, nav: NavItem[], home: NavItem, detail: string | null): Crumb[] {
  const section = [...nav]
    .filter((item) => item.href !== home.href)
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  if (!section) return [{ label: home.label }];

  const trail: Crumb[] = [{ label: home.label, href: home.href }];
  if (pathname === section.href) return [...trail, { label: section.label }];

  trail.push({ label: section.label, href: section.href });
  const rest = pathname.slice(section.href.length + 1);
  trail.push({ label: rest === "new" ? "New" : detail || "Details" });
  return trail;
}

export function Breadcrumbs({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const { detail } = useContext(CrumbContext);
  const home = nav[0];
  const trail = buildTrail(pathname, nav, home, detail);
  const current = trail[trail.length - 1];

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-900">{current.label}</p>
      <nav aria-label="Breadcrumb" className="hidden sm:block">
        <ol className="flex items-center gap-1 text-xs text-slate-500">
          {trail.map((crumb, i) => (
            <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-slate-300" aria-hidden />}
              {crumb.href && i < trail.length - 1 ? (
                <Link href={crumb.href} className="truncate hover:text-indigo-700 hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-medium text-slate-700">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
