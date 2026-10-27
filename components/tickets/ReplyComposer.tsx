"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Lock, RefreshCw, Send, Sparkles, StickyNote, TriangleAlert } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { Alert, Button, Card, ConfirmDialog, cx, Select, Skeleton, Textarea } from "@/components/ui";
import { api, errorCode, errorMessage } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { AdminTicket, Draft, Message, TicketStatus } from "@/lib/types";

interface Props {
  ticket: AdminTicket;
  onSent: (result: { message: Message; ticket?: AdminTicket }) => void;
}

type Mode = "reply" | "note";

export function ReplyComposer({ ticket, onSent }: Props) {
  const notify = useToast();
  const [mode, setMode] = useState<Mode>("reply");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [nextStatus, setNextStatus] = useState<"" | TicketStatus>("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(ticket.isActive);
  const [usedDraft, setUsedDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
  });

  const requestDraft = (force: boolean) => {
    setDrafting(true);
    setDraftError(null);
    fetchDraft(force);
  };

  const fetchDraft = async (force: boolean) => {
    try {
      const res = await api.post(`/admin/tickets/${ticket.id}/ai-draft`, { force });
      const { draft: d, aiError } = res.data.data as { draft: Draft; aiError?: { message: string } };
      setDraft(d);
      if (aiError) setDraftError(`${aiError.message} A policy template was provided instead.`);
      if (!textRef.current.trim() || force) {
        setText(d.text);
        setUsedDraft(true);
      }
    } catch (err) {
      setDraftError(errorCode(err) === "RATE_LIMITED" ? errorMessage(err) : `${errorMessage(err)} You can write the reply manually.`);
    } finally {
      setDrafting(false);
    }
  };

  const draftOnOpen = useEffectEvent(() => {
    if (ticket.isActive) fetchDraft(false);
  });

  useEffect(() => {
    draftOnOpen();
  }, []);

  const sendReply = async () => {
    setSending(true);
    try {
      const res = await api.post(`/admin/tickets/${ticket.id}/messages`, {
        message: text.trim(),
        aiAssisted: usedDraft && draft?.source === "ai",
        ...(nextStatus ? { status: nextStatus } : {}),
      });
      onSent(res.data.data);
      setText("");
      setUsedDraft(false);
      setNextStatus("");
      setDraft(null);
      notify("Reply sent to the author.");
    } catch (err) {
      notify(errorMessage(err), "error");
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  };

  const addNote = async () => {
    setSending(true);
    try {
      const res = await api.post(`/admin/tickets/${ticket.id}/internal-notes`, { note: note.trim() });
      onSent({ message: res.data.data });
      setNote("");
      notify("Internal note added.");
    } catch (err) {
      notify(errorMessage(err), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <div role="tablist" aria-label="Response type" className="flex border-b border-slate-200">
        {(
          [
            ["reply", "Reply to author", Send],
            ["note", "Internal note", StickyNote],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={cx(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium",
              mode === key ? (key === "note" ? "border-amber-500 text-amber-800" : "border-indigo-600 text-indigo-700") : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {mode === "reply" ? (
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-sm text-slate-600">
              <Sparkles className="size-4 text-violet-600" aria-hidden />
              {drafting
                ? "Drafting a reply from the ticket and BookLeaf policies…"
                : draft
                  ? draft.source === "ai"
                    ? `AI draft ${draft.cached ? "(cached) " : ""}generated ${timeAgo(draft.generatedAt)}. Review and edit before sending.`
                    : "Policy template (AI unavailable). Personalise before sending."
                  : "Generate an AI draft, or write your reply below."}
            </p>
            <Button variant="ai" size="sm" onClick={() => requestDraft(Boolean(draft))} loading={drafting} icon={draft ? <RefreshCw className="size-4" /> : <Sparkles className="size-4" />}>
              {draft ? "Regenerate" : "Generate AI draft"}
            </Button>
          </div>

          {draftError && <Alert tone="warning">{draftError}</Alert>}
          {draft && draft.warnings.length > 0 && (
            <Alert tone="warning" title="Check before sending">
              <ul className="list-inside list-disc space-y-0.5">
                {draft.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </Alert>
          )}
          {draft && text !== draft.text && text.trim() !== "" && !drafting && (
            <button
              className="text-xs font-medium text-violet-700 hover:underline"
              onClick={() => {
                setText(draft.text);
                setUsedDraft(true);
              }}
            >
              Replace my text with the AI draft
            </button>
          )}

          {drafting && !text ? (
            <Skeleton className="h-56" />
          ) : (
            <Textarea
              aria-label="Reply to author"
              rows={11}
              value={text}
              maxLength={5000}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your reply to the author…"
              className="font-[inherit] leading-relaxed"
            />
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span id="next-status-label" className="whitespace-nowrap">After sending</span>
              <Select<"" | TicketStatus>
                aria-label="Status after sending"
                size="sm"
                value={nextStatus}
                onChange={setNextStatus}
                className="w-52"
                options={[
                  { value: "", label: ticket.status === "Open" ? "Mark In Progress" : `Keep ${ticket.status}` },
                  ...(["In Progress", "Resolved", "Closed"] as TicketStatus[])
                    .filter((s) => s !== ticket.status && !(ticket.status === "Open" && s === "In Progress"))
                    .map((s) => ({ value: s, label: `Mark ${s}` })),
                ]}
              />
            </div>
            <Button onClick={() => setConfirmOpen(true)} disabled={!text.trim() || drafting} icon={<Send className="size-4" />}>
              Send to author
            </Button>
          </div>
          {ticket.ai?.status !== "completed" && ticket.categorySource !== "admin" && (
            <p className="inline-flex items-center gap-1.5 text-xs text-amber-700">
              <TriangleAlert className="size-3.5" aria-hidden /> AI triage didn&apos;t complete for this ticket. Confirm the category before relying on the draft.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 p-4 sm:p-5">
          <p className="inline-flex items-center gap-1.5 text-sm text-amber-800">
            <Lock className="size-4" aria-hidden /> Only the BookLeaf team can see internal notes. They are never shown or sent to the author.
          </p>
          <Textarea aria-label="Internal note" rows={5} value={note} maxLength={5000} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Checked payout file: Q2 payment bounced, finance re-issuing." />
          <div className="flex justify-end">
            <Button variant="secondary" onClick={addNote} loading={sending} disabled={!note.trim()} icon={<StickyNote className="size-4" />}>
              Add internal note
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Send reply to ${ticket.author.name}?`}
        description={
          <>
            The author will see this message immediately{nextStatus ? ` and the ticket will be marked ${nextStatus}` : ""}.
            {usedDraft && draft?.source === "ai" && " Make sure you've reviewed the AI draft."}
          </>
        }
        confirmLabel="Send reply"
        loading={sending}
        onConfirm={sendReply}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}
