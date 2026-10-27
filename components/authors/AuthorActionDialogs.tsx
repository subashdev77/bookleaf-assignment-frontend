"use client";

import { Alert, Button, ConfirmDialog, Modal } from "@/components/ui";
import { OneTimeLinkNotice } from "./OneTimeLinkNotice";
import type { AuthorActions } from "./useAuthorActions";

export function AuthorActionDialogs({ actions }: { actions: AuthorActions }) {
  const { pending, setPending, busy, error, setError, run, linkResult, setLinkResult } = actions;
  const a = pending?.author;

  const copy = !pending
    ? null
    : pending.kind === "status"
      ? a!.status === "inactive"
        ? {
            title: `Reactivate ${a!.name}?`,
            body: "They will be able to sign in again and see their books and tickets. Nothing is duplicated.",
            label: "Reactivate",
            tone: "primary" as const,
          }
        : {
            title: `Deactivate ${a!.name}?`,
            body: "They will be signed out everywhere immediately and can't sign in or raise tickets. Their books, royalties, tickets and messages are kept and remain visible to the team.",
            label: "Deactivate",
            tone: "danger" as const,
          }
      : pending.kind === "invitation"
        ? {
            title: `Resend invitation to ${a!.name}?`,
            body: "A new single-use invitation link is generated. Any previous invitation link stops working.",
            label: "Resend invitation",
            tone: "primary" as const,
          }
        : {
            title: `Reset password for ${a!.name}?`,
            body: "A single-use reset link is generated. Their current password keeps working until they use it; then all their sessions are signed out.",
            label: "Create reset link",
            tone: "primary" as const,
          };

  return (
    <>
      <ConfirmDialog
        open={Boolean(pending)}
        title={copy?.title || ""}
        description={
          <div className="space-y-3">
            <p>{copy?.body}</p>
            {error && <Alert tone="error">{error}</Alert>}
          </div>
        }
        confirmLabel={copy?.label}
        tone={copy?.tone}
        loading={busy}
        onConfirm={run}
        onCancel={() => {
          setPending(null);
          setError(null);
        }}
      />
      <Modal open={Boolean(linkResult)} onClose={() => setLinkResult(null)} title={linkResult?.kind === "invitation" ? "Invitation issued" : "Password reset issued"}>
        {linkResult && (
          <div className="space-y-4">
            <OneTimeLinkNotice result={linkResult.result} kind={linkResult.kind} email={linkResult.author.email} />
            <div className="flex justify-end">
              <Button onClick={() => setLinkResult(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
