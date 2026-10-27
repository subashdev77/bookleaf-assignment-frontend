"use client";

import Link from "next/link";
import { Flame, Hourglass, Inbox, MessageSquare, Sparkles, TriangleAlert, UserCheck, UserX, Users } from "lucide-react";
import { useRealtimeEvent } from "@/components/providers/RealtimeProvider";
import { ButtonLink, Card, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { AgingBadge, CategoryBadge, PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { api } from "@/lib/api";
import { formatNumber, timeAgo } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import type { AdminTicket, TicketStatus } from "@/lib/types";

interface AdminDashboardData {
  stats: {
    totalTickets: number;
    byStatus: Record<TicketStatus, number>;
    activeByPriority: { Critical: number; High: number; Medium: number; Low: number; Untriaged: number };
    agingTickets: number;
    slaHours: number;
    unassignedActive: number;
    assignedToMe: number;
    awaitingTeamReply: number;
  };
  ai: {
    enabled: boolean;
    model: string | null;
    circuitOpen: boolean;
    triageByStatus: Record<string, number>;
    usage: { calls: number; inputTokens: number; outputTokens: number };
    overrides: { triaged: number; categoryOverridden: number; priorityOverridden: number };
  };
  authors: { total: number; active: number; inactive: number; invitationPending: number };
  needsAttention: AdminTicket[];
  recentTickets: AdminTicket[];
}

const pctOf = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

export default function AdminDashboard() {
  const { data, error, loading, reload } = useApi<AdminDashboardData>(() => api.get("/admin/dashboard").then((r) => r.data.data), []);

  useRealtimeEvent("ticket:created", () => reload());
  useRealtimeEvent("ticket:updated", () => reload());

  if (error && !data) {
    return (
      <>
        <PageHeader title="Support dashboard" />
        <Card>
          <ErrorState message={error} onRetry={() => reload(false)} />
        </Card>
      </>
    );
  }

  const s = data?.stats;

  return (
    <>
      <PageHeader
        title="Support dashboard"
        description="Live overview of the author support queue."
        actions={
          <>
            <ButtonLink href="/admin/authors" variant="secondary" icon={<Users className="size-4" />}>
              Manage authors
            </ButtonLink>
            <ButtonLink href="/admin/tickets" icon={<Inbox className="size-4" />}>
              Open ticket queue
            </ButtonLink>
          </>
        }
      />

      {data && !data.ai.enabled && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-medium">AI assistance is off.</span> New tickets get a provisional keyword-based category and priority, and drafts use
          policy templates. Set <code className="rounded bg-amber-100 px-1">GEMINI_API_KEY</code> on the API to enable AI.
        </div>
      )}
      {data?.ai.circuitOpen && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <span className="font-medium">AI is temporarily paused</span> after repeated errors or rate limiting. It will retry automatically; you can keep working manually.
        </div>
      )}

      <section aria-label="Author summary" className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Link href="/admin/authors" className="rounded-xl focus-visible:outline-2 focus-visible:outline-indigo-600">
              <StatCard label="Total authors" value={data.authors.total} icon={<Users className="size-5" />} tone="indigo" />
            </Link>
            <StatCard label="Active authors" value={data.authors.active} tone="emerald" />
            <StatCard label="Inactive authors" value={data.authors.inactive} icon={<UserX className="size-5" />} tone={data.authors.inactive ? "amber" : "slate"} />
            <StatCard label="Invitations pending" value={data.authors.invitationPending} tone={data.authors.invitationPending ? "amber" : "slate"} />
          </>
        )}
      </section>

      <section aria-label="Ticket summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading || !s ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard label="Total tickets" value={s.totalTickets} icon={<Inbox className="size-5" />} tone="indigo" />
            <StatCard label="Open" value={s.byStatus.Open} hint={`${s.unassignedActive} active & unassigned`} icon={<MessageSquare className="size-5" />} tone="indigo" />
            <StatCard label="In progress" value={s.byStatus["In Progress"]} hint={`${s.assignedToMe} assigned to you`} icon={<UserCheck className="size-5" />} tone="amber" />
            <StatCard label="Resolved" value={s.byStatus.Resolved} hint={`${s.byStatus.Closed} closed`} tone="emerald" />
            <StatCard label="Critical (active)" value={s.activeByPriority.Critical} icon={<Flame className="size-5" />} tone={s.activeByPriority.Critical ? "red" : "slate"} />
            <StatCard label="High (active)" value={s.activeByPriority.High} icon={<TriangleAlert className="size-5" />} tone={s.activeByPriority.High ? "red" : "slate"} />
            <StatCard
              label="Aging unresolved"
              value={s.agingTickets}
              hint={`Open longer than ${s.slaHours}h`}
              icon={<Hourglass className="size-5" />}
              tone={s.agingTickets ? "amber" : "slate"}
            />
            <StatCard label="Awaiting our reply" value={s.awaitingTeamReply} hint="Author spoke last" icon={<MessageSquare className="size-5" />} tone={s.awaitingTeamReply ? "amber" : "slate"} />
          </>
        )}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Needs attention" description="Unresolved tickets, most urgent and oldest first." action={<Link href="/admin/tickets" className="text-sm font-medium text-indigo-600">View queue</Link>} />
          {loading || !data ? (
            <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : data.needsAttention.length === 0 ? (
            <EmptyState title="All caught up" description="There are no unresolved tickets right now." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.needsAttention.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/tickets/${t.id}`}
                    className={`flex flex-col gap-2 px-5 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${t.priority === "Critical" ? "border-l-4 border-red-500" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        <span className="mr-2 font-mono text-xs text-slate-500">{t.ticketNumber}</span>
                        {t.subject}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.author.name} · {t.assignedAdmin ? `Assigned to ${t.assignedAdmin.name}` : "Unassigned"} · {timeAgo(t.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {t.isAging && <AgingBadge hours={t.ageHours} />}
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

        <Card>
          <CardHeader title={<span className="inline-flex items-center gap-1.5"><Sparkles className="size-4 text-violet-600" /> AI assistance</span>} description={data?.ai.model ? `Model: ${data.ai.model}` : undefined} />
          {loading || !data ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : (
            <dl className="divide-y divide-slate-100 text-sm">
              <Row label="Status" value={data.ai.enabled ? (data.ai.circuitOpen ? "Paused" : "Active") : "Off (rule-based fallback)"} />
              <Row label="Tickets triaged by AI" value={formatNumber(data.ai.triageByStatus.completed || 0)} />
              <Row label="Triage failures" value={formatNumber(data.ai.triageByStatus.failed || 0)} />
              <Row label="Category overridden by team" value={`${data.ai.overrides.categoryOverridden} (${pctOf(data.ai.overrides.categoryOverridden, data.ai.overrides.triaged)})`} />
              <Row label="Priority overridden by team" value={`${data.ai.overrides.priorityOverridden} (${pctOf(data.ai.overrides.priorityOverridden, data.ai.overrides.triaged)})`} />
              <Row label="AI calls (all time)" value={formatNumber(data.ai.usage.calls)} />
              <Row label="Tokens in / out" value={`${formatNumber(data.ai.usage.inputTokens)} / ${formatNumber(data.ai.usage.outputTokens)}`} />
            </dl>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent tickets" action={<Link href="/admin/tickets" className="text-sm font-medium text-indigo-600">View all</Link>} />
        {loading || !data ? (
          <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : data.recentTickets.length === 0 ? (
          <EmptyState title="No tickets yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Ticket</th>
                  <th scope="col" className="px-3 py-3">Author</th>
                  <th scope="col" className="px-3 py-3">Priority</th>
                  <th scope="col" className="px-3 py-3">Status</th>
                  <th scope="col" className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/tickets/${t.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                        {t.subject}
                      </Link>
                      <p className="font-mono text-xs text-slate-500">{t.ticketNumber}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{t.author.name}</td>
                    <td className="px-3 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-3 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600">{timeAgo(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
