"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LifeBuoy, Plus, Search } from "lucide-react";
import { useRealtimeEvent } from "@/components/providers/RealtimeProvider";
import { ButtonLink, Card, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, TableSkeleton } from "@/components/ui";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { api } from "@/lib/api";
import { TICKET_STATUSES } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import type { Paginated, Ticket } from "@/lib/types";

const PAGE_SIZE = 10;

export default function MyTicketsPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, error, loading, reload, setData } = useApi<Paginated<Ticket>>(
    () =>
      api
        .get("/tickets", { params: { page, limit: PAGE_SIZE, q: debounced || undefined, status: status || undefined } })
        .then((r) => r.data),
    [page, debounced, status],
  );

  useRealtimeEvent<{ ticket: Ticket }>("ticket:updated", ({ ticket }) => {
    setData((prev) => {
      if (!prev) return prev;
      if (!prev.data.some((t) => t.id === ticket.id)) {
        reload();
        return prev;
      }
      return { ...prev, data: prev.data.map((t) => (t.id === ticket.id ? ticket : t)) };
    });
  });

  const filtered = Boolean(debounced || status);

  return (
    <>
      <PageHeader
        title="My Tickets"
        description="Track your support requests. Replies from the BookLeaf team appear here instantly."
        actions={<ButtonLink href="/tickets/new" icon={<Plus className="size-4" />}>New ticket</ButtonLink>}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              type="search"
              placeholder="Search ticket ID or subject"
              aria-label="Search tickets"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[{ value: "", label: "All statuses" }, ...TICKET_STATUSES.map((s) => ({ value: s, label: s }))]}
            className="sm:w-48"
          />
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={() => reload(false)} />
        ) : loading && !data ? (
          <TableSkeleton />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<LifeBuoy className="size-6" />}
            title={filtered ? "No tickets match these filters" : "You haven't raised any tickets yet"}
            description={filtered ? "Try a different search or status." : "Questions about royalties, ISBNs, printing or your book's status? Our team is here to help."}
            action={!filtered && <ButtonLink href="/tickets/new" icon={<Plus className="size-4" />}>Raise a ticket</ButtonLink>}
          />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {data.data.map((t) => (
                <li key={t.id}>
                  <Link href={`/tickets/${t.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{t.ticketNumber}</span>
                        <p className="truncate font-medium text-slate-900">{t.subject}</p>
                        {t.awaitingReplyFrom === "author" && t.status !== "Closed" && (
                          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">New reply</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {t.book ? t.book.title : "General / account"} · Opened {formatDate(t.createdAt)} · Updated {timeAgo(t.lastMessageAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <CategoryBadge category={t.category} />
                      {t.priority && <PriorityBadge priority={t.priority} />}
                      <StatusBadge status={t.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
