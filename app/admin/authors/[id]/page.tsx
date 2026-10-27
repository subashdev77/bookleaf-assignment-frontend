"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BookOpen, History, LifeBuoy, Pencil, Plus } from "lucide-react";
import { AuthorActionDialogs } from "@/components/authors/AuthorActionDialogs";
import { AuthorRowActions } from "@/components/authors/AuthorRowActions";
import { AccountStatusBadge } from "@/components/authors/AccountStatusBadge";
import { useAuthorActions } from "@/components/authors/useAuthorActions";
import { BookFormDialog } from "@/components/books/BookFormDialog";
import { BookStatus } from "@/components/books/BookStatus";
import { useRealtimeEvent } from "@/components/providers/RealtimeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Alert, Button, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { api } from "@/lib/api";
import { formatDate, formatDateTime, formatINR, formatNumber, timeAgo } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import { usePageCrumb } from "@/components/layout/Breadcrumbs";
import type { AuditEntry, AuthorAccount, Book, Ticket } from "@/lib/types";

interface AuthorDetail {
  author: AuthorAccount;
  books: Book[];
  tickets: Ticket[];
  activity: AuditEntry[];
}

const ACTION_LABELS: Record<string, string> = {
  "author.created": "Account created and invitation issued",
  "author.invitation_sent": "Invitation re-sent",
  "author.password_reset_issued": "Password reset link issued",
  "author.deactivated": "Account deactivated",
  "author.reactivated": "Account reactivated",
  "book.created": "Book added",
  "book.updated": "Book updated",
};

export default function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const notify = useToast();
  const [bookForm, setBookForm] = useState<Book | null | undefined>(undefined);
  const { data, error, loading, reload, setData } = useApi<AuthorDetail>(() => api.get(`/admin/authors/${id}`).then((r) => r.data.data), [id]);
  usePageCrumb(data?.author.name);

  useRealtimeEvent<{ authorId: string }>("books:changed", ({ authorId }) => authorId === id && reload());

  const actions = useAuthorActions((updated) => {
    if (updated) {
      setData((prev) => (prev ? { ...prev, author: { ...prev.author, ...updated } } : prev));
      notify(updated.status === "inactive" ? "Account deactivated." : "Account reactivated.");
    }
    reload();
  });

  if (error && !data) {
    return (
      <>
        <PageHeader title="Author" />
        <Card>
          <ErrorState message={error} onRetry={() => reload(false)} />
        </Card>
      </>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { author, books, tickets, activity } = data;
  const sum = (k: "totalRoyaltyEarned" | "royaltyPaid" | "royaltyPending") => books.reduce((acc, b) => acc + (b[k] || 0), 0);

  return (
    <>
      <PageHeader
        title={author.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <AccountStatusBadge status={author.status} />
            <span>{author.email}</span>
            {author.phone && <span>· {author.phone}</span>}
            {author.externalId && <span className="font-mono text-xs">· {author.externalId}</span>}
          </span>
        }
        actions={<AuthorRowActions author={author} actions={actions} />}
      />

      {author.status === "inactive" && (
        <div className="mb-4">
          <Alert tone="warning">This account is deactivated. The author can&apos;t sign in or raise tickets; their records below are preserved.</Alert>
        </div>
      )}
      {author.status === "invitation_pending" && (
        <div className="mb-4">
          <Alert tone="info">This author hasn&apos;t accepted their invitation yet. Resend it if the link expired or was lost.</Alert>
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Books" value={books.length} hint={`${books.filter((b) => !b.isPublished).length} in production`} />
        <StatCard label="Royalty earned" value={formatINR(sum("totalRoyaltyEarned"))} />
        <StatCard label="Paid / pending" value={formatINR(sum("royaltyPaid"))} hint={`${formatINR(sum("royaltyPending"))} pending`} />
        <StatCard label="Tickets" value={author.counts?.tickets ?? tickets.length} hint={`${author.counts?.openTickets ?? 0} open`} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              title="Books"
              action={
                <Button size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={() => setBookForm(null)}>
                  Add book
                </Button>
              }
            />
            {books.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="size-6" />}
                title="No books linked"
                description="Add a book to this author's catalogue, or import it from BookLeaf's records."
                action={
                  <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setBookForm(null)}>
                    Add book
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3">Title</th>
                      <th scope="col" className="px-3 py-3">Status</th>
                      <th scope="col" className="px-3 py-3 text-right">Sold</th>
                      <th scope="col" className="px-3 py-3 text-right">Earned</th>
                      <th scope="col" className="px-3 py-3 text-right">Pending</th>
                      <th scope="col" className="px-5 py-3 text-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {books.map((b) => (
                      <tr key={b.id}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">{b.title}</p>
                          <p className="text-xs text-slate-500">ISBN {b.isbn || "not assigned"} · {formatDate(b.publicationDate, "Not yet published")}</p>
                        </td>
                        <td className="px-3 py-3"><BookStatus book={b} /></td>
                        <td className="px-3 py-3 text-right tabular-nums">{formatNumber(b.copiesSold)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{formatINR(b.totalRoyaltyEarned)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{formatINR(b.royaltyPending)}</td>
                        <td className="px-5 py-3 text-right">
                          <Button size="sm" variant="secondary" icon={<Pencil className="size-3.5" />} onClick={() => setBookForm(b)} aria-label={`Edit ${b.title}`}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Support tickets" />
            {tickets.length === 0 ? (
              <EmptyState icon={<LifeBuoy className="size-6" />} title="No tickets" description="This author hasn't raised any support tickets." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <li key={t.id}>
                    <Link href={`/admin/tickets/${t.id}`} className="flex flex-col gap-2 px-5 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          <span className="mr-2 font-mono text-xs text-slate-500">{t.ticketNumber}</span>
                          {t.subject}
                        </p>
                        <p className="text-xs text-slate-500">{t.book?.title || "General / account"} · updated {timeAgo(t.lastMessageAt)}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <CategoryBadge category={t.category} />
                        <PriorityBadge priority={t.priority} />
                        <StatusBadge status={t.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="Account" />
            <dl className="space-y-3 p-5 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Created</dt>
                <dd className="text-slate-900">{formatDateTime(author.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Last sign-in</dt>
                <dd className="text-slate-900">{author.lastLoginAt ? formatDateTime(author.lastLoginAt) : "Never"}</dd>
              </div>
              {author.city && (
                <div>
                  <dt className="text-xs text-slate-500">City</dt>
                  <dd className="text-slate-900">{author.city}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title={<span className="inline-flex items-center gap-1.5"><History className="size-4" /> Account activity</span>} />
            {activity.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No administrative actions recorded yet.</p>
            ) : (
              <ol className="divide-y divide-slate-100 text-sm">
                {activity.map((e) => (
                  <li key={e.id} className="px-5 py-3">
                    <p className="text-slate-900">{ACTION_LABELS[e.action] || e.action}</p>
                    <p className="text-xs text-slate-500">
                      by {e.actor} · {formatDateTime(e.createdAt)}
                      {typeof e.details?.title === "string" && ` · "${e.details.title}"`}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </aside>
      </div>

      <AuthorActionDialogs actions={actions} />
      <BookFormDialog
        open={bookForm !== undefined}
        onClose={() => setBookForm(undefined)}
        authorId={author.id}
        book={bookForm ?? null}
        onSaved={() => reload()}
      />
    </>
  );
}
