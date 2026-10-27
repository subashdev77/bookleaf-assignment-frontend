"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { AuthorActionDialogs } from "@/components/authors/AuthorActionDialogs";
import { AuthorRowActions } from "@/components/authors/AuthorRowActions";
import { AccountStatusBadge } from "@/components/authors/AccountStatusBadge";
import { CreateAuthorDialog } from "@/components/authors/CreateAuthorDialog";
import { useAuthorActions } from "@/components/authors/useAuthorActions";
import { useToast } from "@/components/providers/ToastProvider";
import { Button, Card, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, TableSkeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import type { AuthorAccount, Paginated } from "@/lib/types";

const PAGE_SIZE = 20;

export default function AuthorManagementPage() {
  const notify = useToast();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, error, loading, reload, setData } = useApi<Paginated<AuthorAccount>>(
    () => api.get("/admin/authors", { params: { page, limit: PAGE_SIZE, q: debounced || undefined, status: status || undefined } }).then((r) => r.data),
    [page, debounced, status],
  );

  const actions = useAuthorActions((updated) => {
    if (updated) {
      setData((prev) => (prev ? { ...prev, data: prev.data.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)) } : prev));
      notify(updated.status === "inactive" ? `${updated.name} has been deactivated.` : `${updated.name} has been reactivated.`);
    }
  });

  const filtered = Boolean(debounced || status);

  return (
    <>
      <PageHeader
        title="Author management"
        description="Create author accounts, manage access and help authors get back into their account."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            Create author
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input type="search" placeholder="Search by name or email" aria-label="Search authors" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <Select
            aria-label="Filter by account status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "invitation_pending", label: "Invitation pending" },
              { value: "inactive", label: "Inactive" },
            ]}
            className="sm:w-52"
          />
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={() => reload(false)} />
        ) : loading && !data ? (
          <TableSkeleton rows={8} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" />}
            title={filtered ? "No authors match these filters" : "No authors yet"}
            description={filtered ? "Try a different name, email or status." : "Create the first author account to get started."}
            action={!filtered && <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Create author</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3">Author</th>
                    <th scope="col" className="px-3 py-3">Status</th>
                    <th scope="col" className="px-3 py-3 text-right">Books</th>
                    <th scope="col" className="px-3 py-3 text-right">Tickets</th>
                    <th scope="col" className="px-3 py-3">Created</th>
                    <th scope="col" className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/admin/authors/${a.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
                          {a.name}
                        </Link>
                        <p className="text-xs text-slate-500">{a.email}</p>
                      </td>
                      <td className="px-3 py-3"><AccountStatusBadge status={a.status} /></td>
                      <td className="px-3 py-3 text-right tabular-nums">{a.counts?.books ?? 0}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {a.counts?.tickets ?? 0}
                        {a.counts?.openTickets ? <span className="ml-1 text-xs text-amber-700">({a.counts.openTickets} open)</span> : null}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600">{formatDate(a.createdAt)}</td>
                      <td className="px-5 py-2">
                        <AuthorRowActions author={a} actions={actions} showView />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </Card>

      <CreateAuthorDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setPage(1);
          reload();
        }}
      />
      <AuthorActionDialogs actions={actions} />
    </>
  );
}
