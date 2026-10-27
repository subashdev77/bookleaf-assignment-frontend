import { cx } from "@/components/ui";
import type { AccountStatus } from "@/lib/types";

const STATUS_STYLE: Record<AccountStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  inactive: { label: "Inactive", className: "bg-slate-100 text-slate-600 ring-slate-300" },
  invitation_pending: { label: "Invitation pending", className: "bg-amber-50 text-amber-800 ring-amber-200" },
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const s = STATUS_STYLE[status];
  return <span className={cx("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", s.className)}>{s.label}</span>;
}
