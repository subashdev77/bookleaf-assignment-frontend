import type { Book } from "@/lib/types";

export function BookStatus({ book }: { book: Pick<Book, "status" | "isPublished"> }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${
        book.isPublished ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-200"
      }`}
    >
      {book.status}
    </span>
  );
}
