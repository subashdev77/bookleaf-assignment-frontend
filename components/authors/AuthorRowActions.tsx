import { Eye, KeyRound, Mail, Power } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import type { AuthorAccount } from "@/lib/types";
import type { AuthorActions } from "./useAuthorActions";

export function AuthorRowActions({
  author,
  actions,
  showView = false,
}: {
  author: AuthorAccount;
  actions: AuthorActions;
  showView?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {showView && (
        <ButtonLink href={`/admin/authors/${author.id}`} variant="secondary" size="sm" icon={<Eye className="size-4" />}>
          View
        </ButtonLink>
      )}
      {author.status === "invitation_pending" && (
        <Button variant="secondary" size="sm" icon={<Mail className="size-4" />} onClick={() => actions.setPending({ kind: "invitation", author })}>
          Resend invite
        </Button>
      )}
      {author.status === "active" && (
        <Button variant="secondary" size="sm" icon={<KeyRound className="size-4" />} onClick={() => actions.setPending({ kind: "reset", author })}>
          Reset password
        </Button>
      )}
      <Button
        variant={author.status === "inactive" ? "success-outline" : "danger-outline"}
        size="sm"
        icon={<Power className="size-4" />}
        onClick={() => actions.setPending({ kind: "status", author })}
      >
        {author.status === "inactive" ? "Reactivate" : "Deactivate"}
      </Button>
    </div>
  );
}
