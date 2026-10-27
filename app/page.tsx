"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { homeFor, useAuth } from "@/components/providers/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(user ? homeFor(user) : "/login");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading">
      <LoaderCircle className="size-6 animate-spin text-indigo-600" />
    </div>
  );
}
