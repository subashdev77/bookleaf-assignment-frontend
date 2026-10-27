"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { BookMarked } from "lucide-react";
import { homeFor, useAuth } from "@/components/providers/AuthProvider";
import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import type { User } from "@/lib/types";

const SHOW_DEMO = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== "false";
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@bookleaf.demo", password: "Admin@123" },
  { label: "Author", email: process.env.NEXT_PUBLIC_DEMO_AUTHOR_EMAIL || "priya.sharma@email.com", password: "Author@123" },
];

interface FormValues {
  email: string;
  password: string;
}

function destinationFor(user: User, next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) return homeFor(user);
  const isAdminPath = next === "/admin" || next.startsWith("/admin/");
  return (user.role === "admin") === isAdminPath ? next : homeFor(user);
}

function LoginForm() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const next = params.get("next");

  useEffect(() => {
    if (!loading && user) router.replace(destinationFor(user, next));
  }, [user, loading, router, next]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login(values.email.trim(), values.password);
    } catch (err) {
      setServerError(errorMessage(err, "Could not sign in. Please try again."));
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 rounded-xl bg-indigo-600 p-2.5 text-white">
            <BookMarked className="size-6" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold text-slate-900">BookLeaf Author Support</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your author or team account</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {params.get("reason") === "expired" && <Alert tone="warning">Your session ended. Please sign in again.</Alert>}
            {params.get("reason") === "inactive" && (
              <Alert tone="error">Your account has been deactivated. Please contact BookLeaf support if you think this is a mistake.</Alert>
            )}
            {params.get("reason") === "password-reset" && <Alert tone="success">Your password has been reset. Sign in with your new password.</Alert>}
            {serverError && <Alert tone="error">{serverError}</Alert>}

            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" },
                })}
              />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password", { required: "Password is required" })}
              />
            </Field>
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </Card>

        {SHOW_DEMO && (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white/60 p-4 text-sm">
            <p className="mb-2 font-medium text-slate-700">Demo accounts</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <Button
                  key={a.label}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setValue("email", a.email, { shouldValidate: true });
                    setValue("password", a.password, { shouldValidate: true });
                  }}
                >
                  Fill {a.label}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Every seeded author uses the password Author@123. See the README for the full list.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
