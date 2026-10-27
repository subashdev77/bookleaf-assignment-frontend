import { Flame, Hourglass, Sparkles, UserCheck } from "lucide-react";
import { cx } from "@/components/ui";
import type { TicketCategory, TicketPriority, TicketStatus, ValueSource } from "@/lib/types";

const pill = "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

const STATUS_STYLES: Record<TicketStatus, string> = {
  Open: "bg-sky-50 text-sky-700 ring-sky-200",
  "In Progress": "bg-amber-50 text-amber-800 ring-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={cx(pill, STATUS_STYLES[status])}>{status}</span>;
}

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  Critical: "bg-red-600 text-white ring-red-600",
  High: "bg-red-50 text-red-700 ring-red-200",
  Medium: "bg-amber-50 text-amber-800 ring-amber-200",
  Low: "bg-slate-50 text-slate-600 ring-slate-200",
};

export function PriorityBadge({ priority }: { priority: TicketPriority | null }) {
  if (!priority) return <span className={cx(pill, "bg-white text-slate-400 ring-slate-200")}>Untriaged</span>;
  return (
    <span className={cx(pill, PRIORITY_STYLES[priority])}>
      {priority === "Critical" && <Flame className="size-3" aria-hidden />}
      {priority}
    </span>
  );
}

export function CategoryBadge({ category }: { category: TicketCategory | null }) {
  if (!category) return <span className="text-xs text-slate-400">Classifying…</span>;
  return <span className={cx(pill, "bg-indigo-50 text-indigo-700 ring-indigo-100")}>{category}</span>;
}

export function SourceTag({ source }: { source: ValueSource }) {
  if (source === "ai")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-violet-600" title="Set by AI">
        <Sparkles className="size-3" aria-hidden /> AI
      </span>
    );
  if (source === "admin")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-600" title="Set manually by an admin">
        <UserCheck className="size-3" aria-hidden /> Manual
      </span>
    );
  if (source === "rules")
    return (
      <span className="text-xs text-amber-700" title="Provisional keyword-based value (AI unavailable)">
        Provisional
      </span>
    );
  return null;
}

export function AgingBadge({ hours }: { hours: number }) {
  const label = hours >= 48 ? `${Math.floor(hours / 24)}d old` : `${hours}h old`;
  return (
    <span className={cx(pill, "bg-orange-50 text-orange-700 ring-orange-200")} title="Unresolved beyond the response SLA">
      <Hourglass className="size-3" aria-hidden />
      {label}
    </span>
  );
}
