"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { homeFor, useAuth } from "@/components/providers/AuthProvider";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import type { Role } from "@/lib/types";

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Guard role={role}>{children}</Guard>
    </Suspense>
  );
}

function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50" role="status" aria-label="Loading">
      <LoaderCircle className="size-6 animate-spin text-indigo-600" />
    </div>
  );
}

function Guard({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading, signOutReason } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const params = new URLSearchParams({ next: pathname });
      if (signOutReason) params.set("reason", signOutReason);
      router.replace(`/login?${params}`);
    } else if (user.role !== role) {
      router.replace(homeFor(user));
    }
  }, [user, loading, role, router, pathname, signOutReason]);

  if (loading || !user || user.role !== role) return <FullPageSpinner />;

  return <RealtimeProvider>{children}</RealtimeProvider>;
}
