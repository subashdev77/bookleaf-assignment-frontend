"use client";

import Link from "next/link";
import { BookOpen, Hourglass, IndianRupee, LifeBuoy, Plus, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRealtimeEvent } from "@/components/providers/RealtimeProvider";
import { ButtonLink, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { StatusBadge } from "@/components/tickets/badges";
import { api } from "@/lib/api";
import { formatDate, formatINR, formatNumber, timeAgo } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import type { Book, Ticket } from "@/lib/types";

interface DashboardData {
  stats: {
    totalBooks: number;
    publishedBooks: number;
    booksInProduction: number;
    totalCopiesSold: number;
    totalRoyaltyEarned: number;
    royaltyPaid: number;
    royaltyPending: number;
    openTickets: number;
  };
  recentBooks: Book[];
  recentTickets: Ticket[];
}

export default function AuthorDashboard() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi<DashboardData>(() => api.get("/author/dashboard").then((r) => r.data.data), []);

  useRealtimeEvent("ticket:updated", () => reload());
  useRealtimeEvent("books:changed", () => reload());

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0] ?? ""}`}
        description="Your books, royalties and support requests at a glance."
        actions={
          <>
            <ButtonLink href="/books" variant="secondary" icon={<BookOpen className="size-4" />}>
              View my books
            </ButtonLink>
            <ButtonLink href="/tickets/new" icon={<Plus className="size-4" />}>
              New support ticket
            </ButtonLink>
          </>
        }
      />

      {error && !data ? (
        <Card>
          <ErrorState message={error} onRetry={() => reload(false)} />
        </Card>
      ) : (
        <>
          <section aria-label="Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading || !data ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
            ) : (
              <>
                <StatCard
                  label="Books"
                  value={data.stats.totalBooks}
                  hint={`${data.stats.publishedBooks} published · ${data.stats.booksInProduction} in production`}
                  icon={<BookOpen className="size-5" />}
                  tone="indigo"
                />
                <StatCard
                  label="Total royalty earned"
                  value={formatINR(data.stats.totalRoyaltyEarned)}
                  hint={`${formatNumber(data.stats.totalCopiesSold)} copies sold`}
                  icon={<IndianRupee className="size-5" />}
                  tone="emerald"
                />
                <StatCard
                  label="Royalty paid / pending"
                  value={formatINR(data.stats.royaltyPaid)}
                  hint={`${formatINR(data.stats.royaltyPending)} pending payout`}
                  icon={data.stats.royaltyPending > 0 ? <Hourglass className="size-5" /> : <ShieldCheck className="size-5" />}
                  tone={data.stats.royaltyPending > 0 ? "amber" : "emerald"}
                />
                <StatCard
                  label="Open support tickets"
                  value={data.stats.openTickets}
                  hint={data.stats.openTickets ? "Open or in progress" : "Nothing waiting"}
                  icon={<LifeBuoy className="size-5" />}
                  tone={data.stats.openTickets ? "amber" : "slate"}
                />
              </>
            )}
          </section>

          {data && data.stats.royaltyPending > 0 && data.stats.royaltyPending < 1000 && (
            <p className="mt-3 text-xs text-slate-500">
              Pending royalties below ₹1,000 roll over to the next quarter&apos;s payout, per BookLeaf&apos;s royalty policy.
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader title="Recent books" action={<Link href="/books" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</Link>} />
              {loading || !data ? (
                <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : data.recentBooks.length === 0 ? (
                <EmptyState title="No books linked to your account" description="No books are currently associated with your account. Please contact BookLeaf support if you believe this is incorrect." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentBooks.map((b) => (
                    <li key={b.id}>
                      <Link href={`/books/${b.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{b.title}</p>
                          <p className="text-xs text-slate-500">
                            {b.status} · {b.isPublished ? `Published ${formatDate(b.publicationDate)}` : "Not yet published"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium tabular-nums text-slate-900">{formatINR(b.totalRoyaltyEarned)}</p>
                          <p className="text-xs text-slate-500">{formatNumber(b.copiesSold)} sold</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Recent support tickets" action={<Link href="/tickets" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</Link>} />
              {loading || !data ? (
                <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : data.recentTickets.length === 0 ? (
                <EmptyState
                  title="No tickets yet"
                  description="Questions about royalties, ISBNs, printing or your book's status? We're here to help."
                  action={<ButtonLink href="/tickets/new" icon={<Plus className="size-4" />}>Raise a ticket</ButtonLink>}
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentTickets.map((t) => (
                    <li key={t.id}>
                      <Link href={`/tickets/${t.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{t.subject}</p>
                          <p className="text-xs text-slate-500">
                            {t.ticketNumber} · updated {timeAgo(t.lastMessageAt)}
                            {t.awaitingReplyFrom === "author" && t.status !== "Closed" && <span className="ml-1 font-medium text-indigo-600">· New reply</span>}
                          </p>
                        </div>
                        <StatusBadge status={t.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
