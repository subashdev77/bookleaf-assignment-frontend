"use client";

import { useParams } from "next/navigation";
import { ReplyComposer } from "@/components/tickets/ReplyComposer";
import { TicketManagementPanel } from "@/components/tickets/TicketManagementPanel";
import { TicketContextCard } from "@/components/tickets/TicketContextCard";
import { useRealtimeEvent } from "@/components/providers/RealtimeProvider";
import { Card, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import { AgingBadge, CategoryBadge, PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { Conversation } from "@/components/tickets/Conversation";
import { api } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import { usePageCrumb } from "@/components/layout/Breadcrumbs";
import type { AdminTicket, Book, Message } from "@/lib/types";

interface AdminTicketDetail {
  ticket: AdminTicket;
  book: Book | null;
  authorStats: { totalTickets: number };
  messages: Message[];
}

export default function AdminTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload, setData } = useApi<AdminTicketDetail>(() => api.get(`/admin/tickets/${id}`).then((r) => r.data.data), [id]);
  usePageCrumb(data?.ticket.ticketNumber);

  const appendMessage = (message: Message) =>
    setData((prev) => (prev && !prev.messages.some((m) => m.id === message.id) ? { ...prev, messages: [...prev.messages, message] } : prev));
  const replaceTicket = (ticket: AdminTicket) => setData((prev) => (prev ? { ...prev, ticket } : prev));

  useRealtimeEvent<{ ticketId: string; message: Message }>("ticket:message", ({ ticketId, message }) => {
    if (ticketId === id) appendMessage(message);
  });
  useRealtimeEvent<{ ticket: AdminTicket }>("ticket:updated", ({ ticket }) => {
    if (ticket.id === id) replaceTicket(ticket);
  });

  if (error && !data) {
    return (
      <>
        <PageHeader title="Ticket" />
        <Card>
          <ErrorState message={error} onRetry={() => reload(false)} />
        </Card>
      </>
    );
  }

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const { ticket, book, messages, authorStats } = data;

  return (
    <>
      <PageHeader
        title={ticket.subject}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{ticket.ticketNumber}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <CategoryBadge category={ticket.category} />
            {ticket.isAging && <AgingBadge hours={ticket.ageHours} />}
            <span className="text-slate-400">Opened {formatDateTime(ticket.createdAt)}</span>
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card className="p-4 sm:p-5">
            <Conversation
              ticket={ticket}
              messages={messages}
              viewer="admin"
              authorName={ticket.author.name}
              attachmentBase={`/api/v1/admin/tickets/${ticket.id}/attachments`}
            />
          </Card>
          <ReplyComposer
            key={ticket.id}
            ticket={ticket}
            onSent={({ message, ticket: updated }) => {
              appendMessage(message);
              if (updated) replaceTicket(updated);
            }}
          />
        </div>

        <aside className="min-w-0 space-y-6 self-start">
          <TicketManagementPanel ticket={ticket} onUpdated={replaceTicket} />
        </aside>
      </div>

      <div className="mt-6">
        <TicketContextCard ticket={ticket} book={book} authorTickets={authorStats.totalTickets} />
        {ticket.aiUsage && ticket.aiUsage.calls > 0 && (
          <p className="mt-2 px-1 text-xs text-slate-400">
            AI usage on this ticket: {ticket.aiUsage.calls} call(s), {formatNumber(ticket.aiUsage.inputTokens + ticket.aiUsage.outputTokens)} tokens.
          </p>
        )}
      </div>
    </>
  );
}
