"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Paperclip, Send, X } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { Alert, Button, Card, Field, Input, PageHeader, Select, Skeleton, Textarea } from "@/components/ui";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENT_MB, MAX_ATTACHMENTS } from "@/lib/constants";
import { formatBytes } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import type { Book, Paginated } from "@/lib/types";

interface FormValues {
  bookId: string;
  subject: string;
  description: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function NewTicketForm() {
  const router = useRouter();
  const params = useSearchParams();
  const notify = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const books = useApi<Paginated<Book>>(() => api.get("/books", { params: { limit: 100 } }).then((r) => r.data), []);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { bookId: params.get("bookId") || "", subject: "", description: "" } });

  const description = watch("description") || "";

  const addFiles = (list: FileList | null) => {
    setFileError(null);
    const incoming = Array.from(list || []);
    const bad = incoming.find((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_ATTACHMENT_MB * 1024 * 1024);
    if (bad) {
      setFileError(`"${bad.name}" isn't allowed. Use JPG, PNG, WEBP or PDF up to ${MAX_ATTACHMENT_MB} MB.`);
      return;
    }
    const next = [...files, ...incoming].slice(0, MAX_ATTACHMENTS);
    if (files.length + incoming.length > MAX_ATTACHMENTS) setFileError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
    setFiles(next);
    if (fileInput.current) fileInput.current.value = "";
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const form = new FormData();
    form.append("bookId", values.bookId || "general");
    form.append("subject", values.subject.trim());
    form.append("description", values.description.trim());
    files.forEach((f) => form.append("attachments", f));
    try {
      const res = await api.post("/tickets", form);
      notify(`Ticket ${res.data.data.ticketNumber} created. Our team will get back to you soon.`);
      router.push(`/tickets/${res.data.data.id}`);
    } catch (err) {
      const fields = fieldErrors(err);
      Object.entries(fields).forEach(([field, message]) => {
        if (field === "bookId" || field === "subject" || field === "description") setError(field, { message });
      });
      if (!Object.keys(fields).length) setServerError(errorMessage(err));
    }
  };

  return (
    <Card className="max-w-3xl p-5 sm:p-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <Field label="Which book is this about?" htmlFor="bookId" error={errors.bookId?.message} hint="Choose General / Account Level for questions that aren't about a specific book.">
          {books.loading ? (
            <Skeleton className="h-10" />
          ) : (
            <Controller
              name="bookId"
              control={control}
              render={({ field }) => (
                <Select
                  id="bookId"
                  invalid={!!errors.bookId}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "", label: "General / Account Level", description: "Payments, account or anything not about one book" },
                    ...(books.data?.data ?? []).map((b) => ({ value: b.id, label: b.title, description: b.isbn ? `${b.status} · ISBN ${b.isbn}` : b.status })),
                  ]}
                />
              )}
            />
          )}
          {books.error && <p className="mt-1 text-xs text-amber-700">Couldn&apos;t load your books. You can still raise a general query.</p>}
        </Field>

        <Field label="Subject" htmlFor="subject" required error={errors.subject?.message}>
          <Input
            id="subject"
            placeholder="e.g. Royalty for last quarter not received"
            invalid={!!errors.subject}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            {...register("subject", {
              required: "Subject is required",
              validate: (v) => v.trim().length >= 5 || "Subject must be at least 5 characters",
              maxLength: { value: 150, message: "Subject must be at most 150 characters" },
            })}
          />
        </Field>

        <Field
          label="Describe the issue"
          htmlFor="description"
          required
          error={errors.description?.message}
          hint={`Include dates, order numbers, platform names or anything that helps us act faster. ${description.length}/5000`}
        >
          <Textarea
            id="description"
            rows={7}
            invalid={!!errors.description}
            aria-describedby={errors.description ? "description-error" : undefined}
            {...register("description", {
              required: "Description is required",
              validate: (v) => v.trim().length >= 20 || "Please add a little more detail (at least 20 characters)",
              maxLength: { value: 5000, message: "Description must be at most 5000 characters" },
            })}
          />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Attachments <span className="font-normal text-slate-500">(optional)</span></p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/40 focus-within:ring-2 focus-within:ring-indigo-500/30">
            <Paperclip className="size-5 text-slate-400" aria-hidden />
            <span>
              <span className="font-medium text-indigo-600">Choose files</span> such as photos of a print defect or a statement
            </span>
            <span className="text-xs text-slate-500">JPG, PNG, WEBP or PDF · up to {MAX_ATTACHMENTS} files · {MAX_ATTACHMENT_MB} MB each</span>
            <input ref={fileInput} type="file" multiple accept={ATTACHMENT_ACCEPT} className="sr-only" onChange={(e) => addFiles(e.target.files)} disabled={files.length >= MAX_ATTACHMENTS} />
          </label>
          {fileError && <p className="mt-1.5 text-xs text-red-600">{fileError}</p>}
          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm">
                  <span className="truncate">
                    {f.name} <span className="text-slate-400">({formatBytes(f.size)})</span>
                  </span>
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="ml-2 rounded p-1 text-slate-500 hover:bg-slate-100" aria-label={`Remove ${f.name}`}>
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} icon={<Send className="size-4" />}>
            Submit ticket
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function NewTicketPage() {
  return (
    <>
      <PageHeader
        title="Raise a support ticket"
        description="Tell us what's going on. Most queries get a first response within 48 hours."
      />
      <Suspense fallback={<Skeleton className="h-96 max-w-3xl" />}>
        <NewTicketForm />
      </Suspense>
    </>
  );
}
