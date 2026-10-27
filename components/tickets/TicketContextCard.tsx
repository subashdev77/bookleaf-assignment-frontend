"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, ChevronDown, Mail, User } from "lucide-react";
import { BookDetailsGrid } from "@/components/books/BookDetailsGrid";
import { BookStatus } from "@/components/books/BookStatus";
import { Card, cx } from "@/components/ui";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import type { AdminTicket, Book } from "@/lib/types";

type Tab = "author" | "book";

export function TicketContextCard({ ticket, book, authorTickets }: { ticket: AdminTicket; book: Book | null; authorTickets: number }) {
  const [tab, setTab] = useState<Tab>(book ? "book" : "author");
  const [expanded, setExpanded] = useState(false);

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "book", label: "Book", icon: BookOpen },
    { key: "author", label: "Author", icon: User },
  ];

  return (
    <Card>
      <div role="tablist" aria-label="Ticket context" className="flex border-b border-slate-100 px-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            id={`ctx-tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`ctx-panel-${key}`}
            onClick={() => setTab(key)}
            className={cx(
              "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium",
              tab === key ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {tab === "author" ? (
        <div
          id="ctx-panel-author"
          role="tabpanel"
          aria-labelledby="ctx-tab-author"
          className="flex flex-col gap-4 p-5 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="text-base font-medium text-slate-900">{ticket.author.name}</p>
            <a href={`mailto:${ticket.author.email}`} className="inline-flex items-center gap-1 break-all text-indigo-600 hover:underline">
              <Mail className="size-3.5 shrink-0" aria-hidden />
              {ticket.author.email}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <dl className="rounded-lg bg-slate-50 px-4 py-2">
              <dt className="text-xs text-slate-500">Tickets raised</dt>
              <dd className="text-base font-semibold tabular-nums text-slate-900">{authorTickets}</dd>
            </dl>
            <Link href={`/admin/authors/${ticket.author.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View author profile →
            </Link>
          </div>
        </div>
      ) : (
        <div id="ctx-panel-book" role="tabpanel" aria-labelledby="ctx-tab-book">
          {!book ? (
            <p className="p-5 text-sm text-slate-500">General / account-level query. This ticket isn&apos;t linked to a specific book.</p>
          ) : (
            <>
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-base font-medium text-slate-900">{book.title}</p>
                  <BookStatus book={book} />
                  <span className="text-xs text-slate-500">ISBN {book.isbn || "not assigned"}</span>
                  {book.genre && <span className="text-xs text-slate-500">· {book.genre}</span>}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 xl:grid-cols-6">
                  <Stat label="Copies sold" value={formatNumber(book.copiesSold)} />
                  <Stat label="MRP" value={book.mrp == null ? "Not set" : formatINR(book.mrp)} />
                  <Stat label="Royalty earned" value={formatINR(book.totalRoyaltyEarned)} />
                  <Stat label="Pending" value={formatINR(book.royaltyPending)} highlight={book.royaltyPending > 0} />
                  <Stat label="Paid" value={formatINR(book.royaltyPaid)} />
                  <Stat label="Last payout" value={book.isPublished ? formatDate(book.lastRoyaltyPayoutDate, "None yet") : "—"} />
                </dl>
              </div>
              <button
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between border-t border-slate-100 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {expanded ? "Hide full record" : "Show full record"}
                <ChevronDown className={cx("size-4 transition-transform", expanded && "rotate-180")} aria-hidden />
              </button>
              {expanded && (
                <div className="border-t border-slate-100">
                  <BookDetailsGrid book={book} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={cx("truncate font-semibold tabular-nums", highlight ? "text-amber-700" : "text-slate-900")}>{value}</dd>
    </div>
  );
}
