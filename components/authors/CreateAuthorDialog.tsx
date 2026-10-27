"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Button, Field, Input, Modal } from "@/components/ui";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import type { AuthorAccount, OneTimeLinkResult } from "@/lib/types";
import { OneTimeLinkNotice } from "./OneTimeLinkNotice";

interface FormValues {
  name: string;
  email: string;
  phone: string;
}

interface CreateAuthorDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (author: AuthorAccount) => void;
}

export function CreateAuthorDialog({ open, onClose, onCreated }: CreateAuthorDialogProps) {
  const [result, setResult] = useState<{ author: AuthorAccount; invitation: OneTimeLinkResult } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const close = () => {
    reset();
    setResult(null);
    setServerError(null);
    onClose();
  };

  const submit = async (values: FormValues) => {
    setServerError(null);
    try {
      const res = await api.post("/admin/authors", {
        name: values.name.trim(),
        email: values.email.trim(),
        ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
      });
      setResult(res.data.data);
      onCreated(res.data.data.author);
    } catch (err) {
      const fields = fieldErrors(err);
      (["name", "email", "phone"] as const).forEach((f) => fields[f] && setError(f, { message: fields[f] }));
      if (!Object.keys(fields).length) setServerError(errorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={close} title={result ? "Author account created" : "Create author account"}>
      {result ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            <span className="font-medium">{result.author.name}</span> ({result.author.email}) has been added. Their account stays{" "}
            <span className="font-medium">invitation pending</span> until they set their own password.
          </p>
          <OneTimeLinkNotice result={result.invitation} kind="invitation" email={result.author.email} />
          <div className="flex justify-end">
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          {serverError && <Alert tone="error">{serverError}</Alert>}
          <Field label="Full name" htmlFor="author-name" required error={errors.name?.message}>
            <Input
              id="author-name"
              autoComplete="off"
              invalid={!!errors.name}
              {...register("name", {
                required: "Full name is required",
                validate: (v) => v.trim().length >= 2 || "Full name must be at least 2 characters",
                maxLength: { value: 120, message: "Full name must be at most 120 characters" },
              })}
            />
          </Field>
          <Field label="Email address" htmlFor="author-email" required error={errors.email?.message} hint="The author signs in with this email. It must be unique.">
            <Input
              id="author-email"
              type="email"
              autoComplete="off"
              invalid={!!errors.email}
              {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" } })}
            />
          </Field>
          <Field label="Phone number" htmlFor="author-phone" error={errors.phone?.message} hint="Optional.">
            <Input
              id="author-phone"
              type="tel"
              autoComplete="off"
              invalid={!!errors.phone}
              {...register("phone", { pattern: { value: /^[+()\-\s\d]*$/, message: "Enter a valid phone number" } })}
            />
          </Field>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            The account is created with the <span className="font-medium">author</span> role and an invitation to set a password. No password is created or shown to you.
            Books are added from the author&apos;s profile once the account exists.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create & invite
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
