"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { AuthorAccount, OneTimeLinkResult } from "@/lib/types";

type ActionKind = "status" | "invitation" | "reset";
type LinkKind = "invitation" | "reset";

export function useAuthorActions(onChanged: (author?: AuthorAccount) => void) {
  const [pending, setPending] = useState<{ kind: ActionKind; author: AuthorAccount } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkResult, setLinkResult] = useState<{ kind: LinkKind; author: AuthorAccount; result: OneTimeLinkResult } | null>(null);

  const run = async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    const { kind, author } = pending;
    try {
      if (kind === "status") {
        const res = await api.patch(`/admin/authors/${author.id}/status`, { status: author.status === "inactive" ? "active" : "inactive" });
        onChanged(res.data.data);
      } else if (kind === "invitation") {
        const res = await api.post(`/admin/authors/${author.id}/invitation`);
        setLinkResult({ kind, author, result: res.data.data.invitation });
        onChanged();
      } else {
        const res = await api.post(`/admin/authors/${author.id}/password-reset`);
        setLinkResult({ kind, author, result: res.data.data.reset });
        onChanged();
      }
      setPending(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return { pending, setPending, busy, error, setError, run, linkResult, setLinkResult };
}

export type AuthorActions = ReturnType<typeof useAuthorActions>;
