"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Check, Info } from "lucide-react";
import { Alert, Button, cx, Field, Input, Select, Modal, DatePicker } from "@/components/ui";
import { useToast } from "@/components/providers/ToastProvider";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import { BOOK_STATUSES, PLATFORMS, PRINT_PARTNERS, PUBLISHED_STATUS } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import type { Book } from "@/lib/types";

interface Values {
  title: string;
  genre: string;
  isbn: string;
  status: string;
  publicationDate: string;
  mrp: string;
  printPartner: string;
  availableOn: string[];
}

const EMPTY: Values = {
  title: "",
  genre: "",
  isbn: "",
  status: "In Production - Manuscript Received",
  publicationDate: "",
  mrp: "",
  printPartner: "",
  availableOn: [],
};

function valuesFrom(book: Book): Values {
  const partner = (book.details as Record<string, unknown> | null)?.print_partner;
  return {
    title: book.title,
    genre: book.genre ?? "",
    isbn: book.isbn ?? "",
    status: BOOK_STATUSES.includes(book.status) ? book.status : book.isPublished ? PUBLISHED_STATUS : EMPTY.status,
    publicationDate: book.publicationDate ? book.publicationDate.slice(0, 10) : "",
    mrp: book.mrp == null ? "" : String(book.mrp),
    printPartner: typeof partner === "string" ? partner : "",
    availableOn: Array.isArray(book.distribution) ? (book.distribution as string[]) : [],
  };
}

const STATUS_OPTIONS = BOOK_STATUSES.map((s) => ({
  value: s,
  label: s === PUBLISHED_STATUS ? s : s.replace("In Production - ", ""),
  description: s === PUBLISHED_STATUS ? "Live on stores; earns royalties" : "In production",
}));

export function BookFormDialog({
  open,
  onClose,
  authorId,
  book,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  authorId: string;
  book: Book | null;
  onSaved: (book: Book) => void;
}) {
  const notify = useToast();
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(book ? valuesFrom(book) : EMPTY);
  }, [open, book, reset]);

  const published = watch("status") === PUBLISHED_STATUS;
  const rootError = errors.root?.message;

  const submit = async (v: Values) => {
    const body = {
      title: v.title.trim(),
      genre: v.genre.trim() || null,
      isbn: v.isbn.trim() || null,
      status: v.status,
      publicationDate: v.publicationDate || null,
      mrp: v.mrp === "" ? null : Number(v.mrp),
      printPartner: v.printPartner || null,
      availableOn: v.availableOn,
    };
    try {
      const res = book ? await api.patch(`/admin/books/${book.id}`, body) : await api.post(`/admin/authors/${authorId}/books`, body);
      notify(book ? `"${body.title}" updated.` : `"${body.title}" added.`);
      onSaved(res.data.data);
      onClose();
    } catch (err) {
      const fields = fieldErrors(err);
      const known: (keyof Values)[] = ["title", "genre", "isbn", "status", "publicationDate", "mrp", "printPartner", "availableOn"];
      let mapped = false;
      for (const f of known) {
        if (fields[f]) {
          setError(f, { message: fields[f] });
          mapped = true;
        }
      }
      if (!mapped) setError("root", { message: errorMessage(err) });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={book ? "Edit book" : "Add book"} size="lg">
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {rootError && <Alert tone="error">{rootError}</Alert>}

        <Field label="Title" htmlFor="book-title" required error={errors.title?.message}>
          <Input
            id="book-title"
            invalid={!!errors.title}
            {...register("title", { required: "Title is required", validate: (t) => t.trim().length >= 2 || "Title must be at least 2 characters" })}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="book-status" required error={errors.status?.message}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => <Select id="book-status" value={field.value} onChange={field.onChange} options={STATUS_OPTIONS} invalid={!!errors.status} />}
            />
          </Field>
          <Field label="Genre" htmlFor="book-genre" error={errors.genre?.message}>
            <Input id="book-genre" placeholder="e.g. Literary Fiction" invalid={!!errors.genre} {...register("genre")} />
          </Field>
          <Field label="ISBN" htmlFor="book-isbn" required={published} error={errors.isbn?.message} hint={published ? undefined : "Optional until ISBN assignment."}>
            <Input
              id="book-isbn"
              placeholder="978-93-…"
              invalid={!!errors.isbn}
              {...register("isbn", {
                validate: (s) => (!s.trim() ? !published || "A published book needs an ISBN" : /^[0-9Xx-]{10,20}$/.test(s.trim()) || "Digits, hyphens and X only"),
              })}
            />
          </Field>
          <Field label="Print partner" htmlFor="book-partner" error={errors.printPartner?.message}>
            <Controller
              name="printPartner"
              control={control}
              render={({ field }) => (
                <Select
                  id="book-partner"
                  value={field.value}
                  onChange={field.onChange}
                  options={[{ value: "", label: "Not decided yet" }, ...PRINT_PARTNERS.map((p) => ({ value: p, label: p }))]}
                />
              )}
            />
          </Field>
          <Field label="Publication date" htmlFor="book-date" required={published} error={errors.publicationDate?.message}>
            <Controller
              name="publicationDate"
              control={control}
              rules={{ validate: (d) => !published || !!d || "A published book needs a publication date" }}
              render={({ field }) => (
                <DatePicker id="book-date" value={field.value} onChange={field.onChange} invalid={!!errors.publicationDate} placeholder="Not published yet" />
              )}
            />
          </Field>
          <Field label="MRP (₹)" htmlFor="book-mrp" required={published} error={errors.mrp?.message}>
            <Input
              id="book-mrp"
              type="number"
              inputMode="decimal"
              min={1}
              step="1"
              invalid={!!errors.mrp}
              {...register("mrp", {
                validate: (m) => (m === "" ? !published || "A published book needs an MRP" : Number(m) >= 1 || "MRP must be at least ₹1"),
              })}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">Available on</legend>
          <Controller
            name="availableOn"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const on = field.value.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={on}
                      onClick={() => field.onChange(on ? field.value.filter((x) => x !== p) : [...field.value, p])}
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                        on ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400",
                      )}
                    >
                      {on && <Check className="size-3.5" aria-hidden />}
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {!published && <p className="mt-1.5 text-xs text-slate-500">Usually set once the book is live (listings go live 7–10 business days after publication).</p>}
        </fieldset>

        <div className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          <Info className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
          <p>
            Sales and royalty figures can&apos;t be edited here. They come from BookLeaf&apos;s royalty records
            {book ? (
              <>
                {" "}
                (currently {book.copiesSold} sold, {formatINR(book.totalRoyaltyEarned)} earned, {formatINR(book.royaltyPending)} pending)
              </>
            ) : (
              " and start at ₹0 for a new book"
            )}
            .
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {book ? "Save changes" : "Add book"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
