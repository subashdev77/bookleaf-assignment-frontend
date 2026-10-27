"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";
import { useRealtimeEvent } from "@/components/providers/RealtimeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Alert, Button, Card, CardHeader, ErrorState, PageHeader, Skeleton, Textarea } from "@/components/ui";
import { CategoryBadge, PriorityBadge, StatusBadge } from "@/components/tickets/badges";
import { Conversation } from "@/components/tickets/Conversation";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import { usePageCrumb } from "@/components/layout/Breadcrumbs";
import type { Message, Ticket } from "@/lib/types";

interface TicketDetail {
  ticket: Ticket;
  messages: Message[];
}

const STATUS_HELP: Record<Ticket["status"], string> = {
  Open: "Our support team has your request and will respond soon.",
  "In Progress": "A member of our team is working on this.",
  Resolved: "We believe this is resolved. Reply below if you still need help and we'll reopen it.",
  Closed: "This ticket is closed. Raise a new ticket if you need more help.",
};

export default function AuthorTicketPage() {
  const { id } = useParams<{ id: string }>();
  const notify = useToast();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const { data, error, loading, reload, setData } = useApi<TicketDetail>(() => api.get(`/tickets/${id}`).then((r) => r.data.data), [id]);
  usePageCrumb(data?.ticket.ticketNumber);

  useRealtimeEvent<{ ticketId: string; message: Message }>("ticket:message", ({ ticketId, message }) => {
    if (ticketId !== id) return;
    setData((prev) => (prev && !prev.messages.some((m) => m.id === message.id) ? { ...prev, messages: [...prev.messages, message] } : prev));
  });
  useRealtimeEvent<{ ticket: Ticket }>("ticket:updated", ({ ticket }) => {
    if (ticket.id === id) setData((prev) => (prev ? { ...prev, ticket } : prev));
  });

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await api.post(`/tickets/${id}/messages`, { message: reply.trim() });
      const { message, ticket } = res.data.data as { message: Message; ticket: Ticket };
      setData((prev) =>
        prev ? { ticket, messages: prev.messages.some((m) => m.id === message.id) ? prev.messages : [...prev.messages, message] } : prev,
      );
      setReply("");
      if (ticket.status === "Open" && data?.ticket.status === "Resolved") notify("Your ticket has been reopened.", "info");
    } catch (err) {
      setSendError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

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
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  const { ticket, messages } = data;
  const canReply = ticket.status !== "Closed";

  return (
    <>
      <PageHeader
        title={ticket.subject}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{ticket.ticketNumber}</span>
            <StatusBadge status={ticket.status} />
            <CategoryBadge category={ticket.category} />
            {ticket.priority && <PriorityBadge priority={ticket.priority} />}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Alert tone={ticket.status === "Resolved" ? "success" : "info"}>{STATUS_HELP[ticket.status]}</Alert>

          <Card className="p-4 sm:p-5">
            <Conversation ticket={ticket} messages={messages} viewer="author" attachmentBase={`/api/v1/tickets/${ticket.id}/attachments`} />
            {messages.length === 0 && (
              <p className="mt-4 text-center text-sm text-slate-500">No replies yet. You&apos;ll see the team&apos;s response here as soon as it&apos;s sent.</p>
            )}
          </Card>

          {canReply ? (
            <Card className="p-4 sm:p-5">
              <label htmlFor="reply" className="mb-1.5 block text-sm font-medium text-slate-700">
                Reply to the BookLeaf team
              </label>
              <Textarea id="reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={5000} placeholder="Add more details or answer the team's questions…" />
              {sendError && <p className="mt-2 text-sm text-red-600">{sendError}</p>}
              <div className="mt-3 flex justify-end">
                <Button onClick={send} loading={sending} disabled={!reply.trim()} icon={<Send className="size-4" />}>
                  Send reply
                </Button>
              </div>
            </Card>
          ) : (
            <p className="text-sm text-slate-500">
              This ticket is closed. <Link href="/tickets/new" className="font-medium text-indigo-600">Raise a new ticket</Link> if you need more help.
            </p>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Details" />
            <dl className="space-y-3 p-5 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Related book</dt>
                <dd className="mt-0.5 text-slate-900">
                  {ticket.book ? (
                    <Link href={`/books/${ticket.book.id}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                      {ticket.book.title}
                    </Link>
                  ) : (
                    "General / Account Level"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Opened</dt>
                <dd className="mt-0.5 text-slate-900">{formatDateTime(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Last update</dt>
                <dd className="mt-0.5 text-slate-900">{formatDateTime(ticket.updatedAt)}</dd>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <dt className="text-xs text-slate-500">Resolved</dt>
                  <dd className="mt-0.5 text-slate-900">{formatDateTime(ticket.resolvedAt)}</dd>
                </div>
              )}
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}
