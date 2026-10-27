"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { BookStatus } from "@/components/books/BookStatus";
import { useRealtimeEvent } from "@/components/providers/RealtimeProvider";
import { ButtonLink, Card, EmptyState, ErrorState, Input, PageHeader, Pagination, TableSkeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import type { Book, Paginated } from "@/lib/types";

const PAGE_SIZE = 10;

export default function BooksPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, error, loading, reload } = useApi<Paginated<Book>>(
    () => api.get("/books", { params: { page, limit: PAGE_SIZE, q: debounced || undefined } }).then((r) => r.data),
    [page, debounced],
  );

  useRealtimeEvent("books:changed", () => reload());

  return (
    <>
      <PageHeader title="My Books" description="Sales and royalty figures for every book you've published with BookLeaf." />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              type="search"
              placeholder="Search by title, ISBN or genre"
              aria-label="Search books"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={() => reload(false)} />
        ) : loading && !data ? (
          <TableSkeleton />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="size-6" />}
            title={debounced ? "No books match your search" : "No books linked to your account"}
            action={!debounced && <ButtonLink href="/tickets/new" variant="secondary">Contact support</ButtonLink>}
            description={debounced ? "Try a different title, ISBN or genre." : "No books are currently associated with your account. Please contact BookLeaf support if you believe this is incorrect."}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3">Book</th>
                    <th scope="col" className="px-3 py-3">Status</th>
                    <th scope="col" className="px-3 py-3">Published</th>
                    <th scope="col" className="px-3 py-3 text-right">MRP</th>
                    <th scope="col" className="px-3 py-3 text-right">Copies sold</th>
                    <th scope="col" className="px-3 py-3 text-right">Royalty earned</th>
                    <th scope="col" className="px-3 py-3 text-right">Paid</th>
                    <th scope="col" className="px-5 py-3 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="max-w-xs px-5 py-3">
                        <Link href={`/books/${b.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                          {b.title}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {b.genre || "—"} · ISBN {b.isbn || "not yet assigned"}
                        </p>
                      </td>
                      <td className="px-3 py-3"><BookStatus book={b} /></td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600">{formatDate(b.publicationDate, "Not yet")}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{b.mrp == null ? "—" : formatINR(b.mrp)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatNumber(b.copiesSold)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatINR(b.totalRoyaltyEarned)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatINR(b.royaltyPaid)}</td>
                      <td className={`px-5 py-3 text-right tabular-nums ${b.royaltyPending > 0 ? "font-medium text-amber-700" : "text-slate-500"}`}>
                        {formatINR(b.royaltyPending)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 lg:hidden">
              {data.data.map((b) => (
                <li key={b.id}>
                  <Link href={`/books/${b.id}`} className="block px-4 py-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-slate-900">{b.title}</p>
                      <BookStatus book={b} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {b.genre || "—"} · ISBN {b.isbn || "not yet assigned"} · {formatDate(b.publicationDate, "Not yet published")}
                    </p>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div><dt className="text-slate-500">Sold</dt><dd className="font-medium tabular-nums">{formatNumber(b.copiesSold)}</dd></div>
                      <div><dt className="text-slate-500">Earned</dt><dd className="font-medium tabular-nums">{formatINR(b.totalRoyaltyEarned)}</dd></div>
                      <div><dt className="text-slate-500">Pending</dt><dd className="font-medium tabular-nums">{formatINR(b.royaltyPending)}</dd></div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
