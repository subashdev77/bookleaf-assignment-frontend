import { formatDate, formatINR, formatNumber } from "@/lib/format";
import type { Book } from "@/lib/types";

const label = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.map(renderValue).join(", ") : "—";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${label(k)}: ${renderValue(v)}`)
      .join(" · ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function BookDetailsGrid({ book, compact = false }: { book: Book; compact?: boolean }) {
  const rows: [string, React.ReactNode][] = [
    ["ISBN", book.isbn || "Not yet assigned"],
    ["Genre", book.genre || "—"],
    ["Status", book.status],
    ["Publication date", formatDate(book.publicationDate, "Not yet published")],
    ["MRP", book.mrp == null ? "Not set yet" : formatINR(book.mrp)],
    ["Copies sold", formatNumber(book.copiesSold)],
    ["Total royalty earned", formatINR(book.totalRoyaltyEarned)],
    ["Royalty paid", formatINR(book.royaltyPaid)],
    ["Royalty pending", formatINR(book.royaltyPending)],
  ];
  if (book.isPublished) rows.push(["Last royalty payout", formatDate(book.lastRoyaltyPayoutDate, "No payout yet")]);
  if (book.distribution) rows.push(["Available on", renderValue(book.distribution)]);
  for (const [k, v] of Object.entries(book.details || {})) rows.push([label(k), renderValue(v)]);

  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 p-5 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {rows.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</dt>
          <dd className="mt-1 break-words text-sm text-slate-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
