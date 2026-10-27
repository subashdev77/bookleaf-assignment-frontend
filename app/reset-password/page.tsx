"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { Alert } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";

function ResetPassword() {
  const token = useSearchParams().get("token") || "";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const reset = async (password: string) => {
    setError(null);
    try {
      await api.post("/auth/reset-password", { token, password });
      router.replace("/login?reason=password-reset");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="This will sign you out of BookLeaf on all other devices."
      footer={<Link href="/login" className="font-medium text-indigo-600">Back to sign in</Link>}
    >
      {token ? <SetPasswordForm submitLabel="Reset password" error={error} onSubmit={reset} /> : <Alert tone="error">This reset link is incomplete.</Alert>}
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}
