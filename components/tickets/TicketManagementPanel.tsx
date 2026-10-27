"use client";

import { useState } from "react";
import { RefreshCw, Sparkles, UserCheck, UserMinus } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button, Card, ConfirmDialog, cx, Select } from "@/components/ui";
import { SourceTag } from "@/components/tickets/badges";
import { api, errorMessage } from "@/lib/api";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/constants";
import { pct } from "@/lib/format";
import type { AdminTicket, TicketCategory, TicketPriority, TicketStatus } from "@/lib/types";

const AI_STATUS_TEXT: Record<string, string> = {
  pending: "AI triage in progress…",
  failed: "AI triage failed. The values above are provisional (keyword rules).",
  disabled: "AI is off. The values above are provisional (keyword rules).",
};

const STATUS_HINTS: Record<TicketStatus, string> = {
  Open: "Waiting for the team",
  "In Progress": "Someone is working on it",
  Resolved: "Author can reply to reopen",
  Closed: "Author must raise a new ticket",
};

const PRIORITY_HINTS: Record<TicketPriority, string> = {
  Critical: "Ongoing harm, act today",
  High: "Policy escalation (ISBN error, overdue royalty, defect)",
  Medium: "Needs investigation, no immediate harm",
  Low: "Routine or informational",
};

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</h3>
      {aside}
    </div>
  );
}

function AiSuggestion({ value, confidence, current }: { value: string | null; confidence: number | null; current: string | null }) {
  if (!value) return null;
  const differs = current !== value;
  const low = (confidence ?? 1) < 0.6;
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-violet-700 ring-1 ring-violet-100 ring-inset">
        <Sparkles className="size-3" aria-hidden />
        AI: {value} · {pct(confidence)}
      </span>
      {differs && <span>Overridden by team</span>}
      {!differs && low && <span className="text-amber-700">Low confidence, please verify</span>}
    </p>
  );
}

export function TicketManagementPanel({ ticket, onUpdated }: { ticket: AdminTicket; onUpdated: (t: AdminTicket) => void }) {
  const { user } = useAuth();
  const notify = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingClose, setPendingClose] = useState(false);

  const patch = async (key: string, path: string, body: object, success: string) => {
    setBusy(key);
    try {
      const res = await api.patch(`/admin/tickets/${ticket.id}/${path}`, body);
      onUpdated(res.data.data);
      notify(success);
    } catch (err) {
      notify(errorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  };

  const changeStatus = (status: TicketStatus) => {
    if (status === "Closed") return setPendingClose(true);
    patch("status", "status", { status }, `Status changed to ${status}.`);
  };

  const reclassify = async () => {
    setBusy("reclassify");
    try {
      const res = await api.post(`/admin/tickets/${ticket.id}/reclassify`);
      onUpdated(res.data.data);
      notify("AI triage re-run.");
    } catch (err) {
      notify(errorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  };

  const assignedToMe = ticket.assignedAdmin?.id === user?.id;
  const ai = ticket.ai;
  const aiDone = ai?.status === "completed";

  return (
    <Card className="divide-y divide-slate-100">
      <div className="px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Manage ticket</h2>
        <p className="mt-0.5 text-xs text-slate-500">Changes are saved immediately and shown to the author live.</p>
      </div>

      <section className="px-5 py-4">
        <SectionTitle>Workflow</SectionTitle>
        <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-700">
          Status
        </label>
        <Select<TicketStatus>
          id="status"
          value={ticket.status}
          disabled={busy === "status"}
          onChange={changeStatus}
          options={TICKET_STATUSES.map((s) => ({ value: s, label: s, description: STATUS_HINTS[s] }))}
        />

        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Assignee</p>
            <p className={cx("truncate text-sm font-medium", ticket.assignedAdmin ? "text-slate-900" : "text-slate-400")}>
              {ticket.assignedAdmin ? `${ticket.assignedAdmin.name}${assignedToMe ? " (you)" : ""}` : "Unassigned"}
            </p>
          </div>
          {assignedToMe ? (
            <Button
              variant="secondary"
              size="sm"
              loading={busy === "assign"}
              icon={<UserMinus className="size-4" />}
              onClick={() => patch("assign", "assignment", { assigneeId: null }, "Ticket unassigned.")}
            >
              Unassign
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              loading={busy === "assign"}
              icon={<UserCheck className="size-4" />}
              onClick={() => patch("assign", "assignment", { assigneeId: user?.id }, "Ticket assigned to you.")}
            >
              {ticket.assignedAdmin ? "Take over" : "Assign to me"}
            </Button>
          )}
        </div>
      </section>

      <section className="px-5 py-4">
        <SectionTitle>Classification</SectionTitle>

        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="category" className="text-sm font-medium text-slate-700">
            Category
          </label>
          <SourceTag source={ticket.categorySource} />
        </div>
        <Select<TicketCategory | "">
          id="category"
          value={ticket.category || ""}
          placeholder="Not classified yet"
          disabled={busy === "category"}
          onChange={(v) => v && patch("category", "category", { category: v }, "Category updated.")}
          options={TICKET_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        {aiDone && <AiSuggestion value={ai.category} confidence={ai.categoryConfidence} current={ticket.category} />}

        <div className="mt-4 mb-1.5 flex items-center justify-between">
          <label htmlFor="priority" className="text-sm font-medium text-slate-700">
            Priority
          </label>
          <SourceTag source={ticket.prioritySource} />
        </div>
        <Select<TicketPriority | "">
          id="priority"
          value={ticket.priority || ""}
          placeholder="Not prioritised yet"
          disabled={busy === "priority"}
          onChange={(v) => v && patch("priority", "priority", { priority: v }, "Priority updated.")}
          options={TICKET_PRIORITIES.map((p) => ({ value: p, label: p, description: PRIORITY_HINTS[p] }))}
        />
        {aiDone && <AiSuggestion value={ai.priority} confidence={ai.priorityConfidence} current={ticket.priority} />}
      </section>

      <section className="px-5 py-4">
        <SectionTitle
          aside={
            <Button variant="ai-outline" size="sm" loading={busy === "reclassify"} onClick={reclassify} icon={<RefreshCw className="size-3.5" />}>
              Re-run
            </Button>
          }
        >
          <span className="inline-flex items-center gap-1.5 text-violet-700">
            <Sparkles className="size-3.5" aria-hidden /> AI triage
          </span>
        </SectionTitle>
        <p className="text-sm leading-relaxed text-slate-700">{aiDone ? ai.reason || "No reasoning provided." : AI_STATUS_TEXT[ai?.status || "pending"]}</p>
        {(ticket.categorySource === "admin" || ticket.prioritySource === "admin") && (
          <p className="mt-2 text-xs text-slate-500">Manual overrides are kept even if AI triage is re-run.</p>
        )}
      </section>

      <ConfirmDialog
        open={pendingClose}
        tone="danger"
        title="Close this ticket?"
        description="The author will no longer be able to reply to a closed ticket and will need to raise a new one. Use Resolved if you expect a follow-up."
        confirmLabel="Close ticket"
        loading={busy === "status"}
        onCancel={() => setPendingClose(false)}
        onConfirm={async () => {
          await patch("status", "status", { status: "Closed" }, "Ticket closed.");
          setPendingClose(false);
        }}
      />
    </Card>
  );
}
