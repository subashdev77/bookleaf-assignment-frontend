"use client";

import { useParams } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { BookStatus } from "@/components/books/BookStatus";
import { BookDetailsGrid } from "@/components/books/BookDetailsGrid";
import { useRealtimeEvent } from "@/components/providers/RealtimeProvider";
import { ButtonLink, Card, CardHeader, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { usePageCrumb } from "@/components/layout/Breadcrumbs";
import type { Book } from "@/lib/types";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: book, error, loading, reload } = useApi<Book>(() => api.get(`/books/${id}`).then((r) => r.data.data), [id]);
  usePageCrumb(book?.title);
  useRealtimeEvent("books:changed", () => reload());

  if (error && !book) {
    return (
      <>
        <PageHeader title="Book" />
        <Card>
          <ErrorState message={error} onRetry={() => reload(false)} />
        </Card>
      </>
    );
  }

  if (loading || !book) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={book.title}
        description={<BookStatus book={book} />}
        actions={
          <ButtonLink href={`/tickets/new?bookId=${book.id}`} icon={<LifeBuoy className="size-4" />}>
            Get help with this book
          </ButtonLink>
        }
      />
      <Card>
        <CardHeader title="Book details" description="Figures come directly from BookLeaf's royalty records." />
        <BookDetailsGrid book={book} />
      </Card>
      {!book.isPublished && (
        <p className="mt-4 text-sm text-slate-500">
          This book is still in production, so sales and royalty figures will start once it is published and live on stores.
        </p>
      )}
    </>
  );
}
