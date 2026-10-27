"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Inbox, Search, X } from "lucide-react";
import { useRealtimeEvent } from "@/components/providers/RealtimeProvider";
import { Button, Card, cx, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, TableSkeleton, DatePicker } from "@/components/ui";
import { AgingBadge, CategoryBadge, PriorityBadge, SourceTag, StatusBadge } from "@/components/tickets/badges";
import { api } from "@/lib/api";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import type { AdminTicket, Paginated } from "@/lib/types";

const PAGE_SIZE = 20;

interface Filters {
  status: string;
  category: string;
  priority: string;
  assigned: string;
  from: string;
  to: string;
  sort: string;
}

const DEFAULT_FILTERS: Filters = { status: "Open,In Progress", category: "", priority: "", assigned: "", from: "", to: "", sort: "urgency" };

const SORT_OPTIONS = [
  { value: "urgency", label: "Most urgent first" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "priority", label: "Priority" },
  { value: "updated", label: "Recently updated" },
];

export default function TicketQueuePage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [newTickets, setNewTickets] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const params = Object.fromEntries(Object.entries({ ...filters, q: debounced }).filter(([, v]) => v));
  const { data, error, loading, reload, setData } = useApi<Paginated<AdminTicket>>(
    () => api.get("/admin/tickets", { params: { ...params, page, limit: PAGE_SIZE } }).then((r) => r.data),
    [JSON.stringify(params), page],
  );

  useRealtimeEvent("ticket:created", () => setNewTickets((n) => n + 1));
  useRealtimeEvent<{ ticket: AdminTicket }>("ticket:updated", ({ ticket }) => {
    setData((prev) => (prev ? { ...prev, data: prev.data.map((t) => (t.id === ticket.id ? ticket : t)) } : prev));
  });

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS) && !query;

  return (
    <>
      <PageHeader title="Ticket queue" description="All author support tickets. Critical and aging tickets are highlighted." />

      {newTickets > 0 && (
        <button
          onClick={() => {
            setNewTickets(0);
            reload();
          }}
          className="mb-4 w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
        >
          {newTickets} new ticket{newTickets > 1 ? "s" : ""} received. Click to refresh the queue.
        </button>
      )}

      <Card>
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input type="search" placeholder="Search ticket ID (BL-1001) or subject" aria-label="Search tickets" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <Select aria-label="Sort" value={filters.sort} onChange={(v) => update({ sort: v })} options={SORT_OPTIONS} className="lg:w-52" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Select
              aria-label="Filter by status"
              value={filters.status}
              onChange={(v) => update({ status: v })}
              options={[
                { value: "", label: "All statuses" },
                { value: "Open,In Progress", label: "Unresolved" },
                ...TICKET_STATUSES.map((s) => ({ value: s, label: s })),
              ]}
            />
            <Select
              aria-label="Filter by category"
              value={filters.category}
              onChange={(v) => update({ category: v })}
              options={[{ value: "", label: "All categories" }, ...TICKET_CATEGORIES.map((c) => ({ value: c, label: c }))]}
            />
            <Select
              aria-label="Filter by priority"
              value={filters.priority}
              onChange={(v) => update({ priority: v })}
              options={[
                { value: "", label: "All priorities" },
                ...TICKET_PRIORITIES.map((p) => ({ value: p, label: p })),
                { value: "Untriaged", label: "Untriaged" },
              ]}
            />
            <Select
              aria-label="Filter by assignee"
              value={filters.assigned}
              onChange={(v) => update({ assigned: v })}
              options={[
                { value: "", label: "Anyone" },
                { value: "me", label: "Assigned to me" },
                { value: "unassigned", label: "Unassigned" },
              ]}
            />
            <DatePicker aria-label="Created from" placeholder="Created from" value={filters.from} max={filters.to || undefined} onChange={(v) => update({ from: v })} />
            <DatePicker aria-label="Created to" placeholder="Created to" value={filters.to} min={filters.from || undefined} onChange={(v) => update({ to: v })} />
          </div>
          {!isDefault && (
            <Button
              variant="secondary"
              size="sm"
              icon={<X className="size-4" />}
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                setQuery("");
                setPage(1);
              }}
            >
              Reset filters
            </Button>
          )}
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={() => reload(false)} />
        ) : loading && !data ? (
          <TableSkeleton rows={8} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={<Inbox className="size-6" />} title={isDefault ? "No unresolved tickets" : "No tickets match these filters"} description={isDefault ? "The queue is clear." : "Try widening the filters."} />
        ) : (
          <>
            <div className={cx("overflow-x-auto transition-opacity", loading && "opacity-60")}>
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="w-[30%] min-w-80 px-5 py-3">Ticket</th>
                    <th scope="col" className="px-3 py-3">Author / Book</th>
                    <th scope="col" className="px-3 py-3">Category</th>
                    <th scope="col" className="px-3 py-3">Priority</th>
                    <th scope="col" className="px-3 py-3">Status</th>
                    <th scope="col" className="px-3 py-3">Assignee</th>
                    <th scope="col" className="px-5 py-3">Created / Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/admin/tickets/${t.id}`)}
                      className={cx(
                        "cursor-pointer hover:bg-slate-50",
                        t.priority === "Critical" && t.isActive && "bg-red-50/60 shadow-[inset_4px_0_0_0_#dc2626] hover:bg-red-50",
                        t.isAging && t.priority !== "Critical" && "shadow-[inset_4px_0_0_0_#f97316]",
                      )}
                    >
                      <td className="min-w-80 px-5 py-3">
                        <Link href={`/admin/tickets/${t.id}`} className="font-medium text-slate-900 hover:text-indigo-700" onClick={(e) => e.stopPropagation()}>
                          {t.subject}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono">{t.ticketNumber}</span>
                          {t.awaitingReplyFrom === "admin" && t.isActive && <span className="font-medium text-indigo-600">Awaiting reply</span>}
                          {t.isAging && <AgingBadge hours={t.ageHours} />}
                        </div>
                      </td>
                      <td className="max-w-[14rem] px-3 py-3">
                        <p className="truncate text-slate-900">{t.author.name}</p>
                        <p className="truncate text-xs text-slate-500">{t.book?.title || "General / account"}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <CategoryBadge category={t.category} />
                          <SourceTag source={t.categorySource} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <PriorityBadge priority={t.priority} />
                          <SourceTag source={t.prioritySource} />
                        </div>
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-3 py-3 text-slate-600">{t.assignedAdmin?.name || <span className="text-slate-400">Unassigned</span>}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-600">
                        <p>{formatDate(t.createdAt)}</p>
                        <p className="text-slate-400">updated {timeAgo(t.updatedAt)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
