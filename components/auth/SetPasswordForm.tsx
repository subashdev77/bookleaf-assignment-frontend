"use client";

import { useForm } from "react-hook-form";
import { Alert, Button, Field, Input } from "@/components/ui";

interface Values {
  password: string;
  confirm: string;
}

export const passwordRules = {
  required: "Password is required",
  minLength: { value: 8, message: "Use at least 8 characters" },
  maxLength: { value: 128, message: "Use at most 128 characters" },
  validate: (v: string) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || "Include at least one letter and one number",
};

export function SetPasswordForm({
  submitLabel,
  error,
  onSubmit,
}: {
  submitLabel: string;
  error?: string | null;
  onSubmit: (password: string) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>();

  return (
    <form onSubmit={handleSubmit(({ password }) => onSubmit(password))} noValidate className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <Field label="New password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters, with a letter and a number.">
        <Input id="password" type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password", passwordRules)} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          invalid={!!errors.confirm}
          {...register("confirm", { required: "Please confirm your password", validate: (v) => v === getValues("password") || "Passwords don't match" })}
        />
      </Field>
      <Button type="submit" className="w-full" loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
