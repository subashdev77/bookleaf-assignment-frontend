"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Alert, Button, Input } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { OneTimeLinkResult } from "@/lib/types";

interface OneTimeLinkNoticeProps {
  result: OneTimeLinkResult;
  kind: "invitation" | "reset";
  email: string;
}

export function OneTimeLinkNotice({ result, kind, email }: OneTimeLinkNoticeProps) {
  const [copied, setCopied] = useState(false);
  const noun = kind === "invitation" ? "invitation link" : "password reset link";

  return (
    <div className="space-y-3">
      <Alert tone="info" title={kind === "invitation" ? "Share the invitation link" : "Share the reset link"}>
        <span className="inline-flex items-start gap-1.5">
          <Link2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          Send this one-time {noun} to {email} through a trusted channel.
        </span>
      </Alert>
      <div>
        <label htmlFor="one-time-link" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
          One-time link · expires {formatDateTime(result.expiresAt)}
        </label>
        <div className="flex gap-2">
          <Input id="one-time-link" readOnly value={result.url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
          <Button
            type="button"
            variant="secondary"
            aria-label="Copy link"
            icon={copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            onClick={async () => {
              await navigator.clipboard.writeText(result.url);
              setCopied(true);
            }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">The link works once. It is not stored anywhere and won&apos;t be shown again; issue a new one if it&apos;s lost.</p>
      </div>
    </div>
  );
}
