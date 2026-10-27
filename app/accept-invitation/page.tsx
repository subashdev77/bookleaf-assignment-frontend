"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { Alert } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";

type State = { kind: "loading" } | { kind: "invalid"; message: string } | { kind: "ready"; name: string; email: string };

function AcceptInvitation() {
  const token = useSearchParams().get("token") || "";
  const router = useRouter();
  const { setUser } = useAuth();
  const [state, setState] = useState<State>(token ? { kind: "loading" } : { kind: "invalid", message: "This invitation link is incomplete." });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get("/auth/invitation", { params: { token } })
      .then((res) => setState({ kind: "ready", ...res.data.data }))
      .catch((err) => setState({ kind: "invalid", message: errorMessage(err) }));
  }, [token]);

  const accept = async (password: string) => {
    setError(null);
    try {
      const res = await api.post("/auth/accept-invitation", { token, password });
      setUser(res.data.data.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (state.kind === "loading") {
    return (
      <AuthLayout title="Checking your invitation…">
        <div className="flex justify-center py-6" role="status" aria-label="Loading">
          <LoaderCircle className="size-6 animate-spin text-indigo-600" />
        </div>
      </AuthLayout>
    );
  }

  if (state.kind === "invalid") {
    return (
      <AuthLayout title="Invitation unavailable" footer={<Link href="/login" className="font-medium text-indigo-600">Go to sign in</Link>}>
        <Alert tone="error">{state.message}</Alert>
        <p className="mt-3 text-sm text-slate-600">Invitation links work once and expire after a few days. Ask the BookLeaf team to send you a new one.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={`Welcome to BookLeaf, ${state.name.split(" ")[0]}`}
      subtitle={
        <>
          Set a password for <span className="font-medium text-slate-700">{state.email}</span> to access your author portal.
        </>
      }
    >
      <SetPasswordForm submitLabel="Set password & continue" error={error} onSubmit={accept} />
    </AuthLayout>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitation />
    </Suspense>
  );
}
