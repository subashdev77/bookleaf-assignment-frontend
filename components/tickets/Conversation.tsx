import { Lock, Sparkles } from "lucide-react";
import { cx } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { Attachments } from "./Attachments";
import type { Attachment, Message, Role, Ticket } from "@/lib/types";

export function Conversation({
  ticket,
  messages,
  viewer,
  authorName,
  attachmentBase,
}: {
  ticket: Ticket;
  messages: Message[];
  viewer: Role;
  authorName?: string;
  attachmentBase: string;
}) {
  return (
    <ol className="space-y-4" aria-label="Conversation">
      <MessageBubble
        mine={viewer === "author"}
        senderLabel={viewer === "author" ? "You" : authorName || "Author"}
        role="author"
        body={ticket.description}
        createdAt={ticket.createdAt}
        attachments={ticket.attachments}
        attachmentBase={attachmentBase}
        tag="Original request"
      />
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          mine={m.senderRole === viewer}
          senderLabel={
            m.senderRole === "admin"
              ? viewer === "author"
                ? `${m.sender.name || "BookLeaf"} · BookLeaf Support`
                : m.sender.name || "Admin"
              : viewer === "author"
                ? "You"
                : authorName || "Author"
          }
          role={m.senderRole}
          body={m.body}
          createdAt={m.createdAt}
          internal={m.visibility === "internal"}
          aiAssisted={m.aiAssisted}
        />
      ))}
    </ol>
  );
}

function MessageBubble({
  mine,
  senderLabel,
  role,
  body,
  createdAt,
  internal,
  aiAssisted,
  attachments,
  attachmentBase,
  tag,
}: {
  mine: boolean;
  senderLabel: string;
  role: Role;
  body: string;
  createdAt: string;
  internal?: boolean;
  aiAssisted?: boolean;
  attachments?: Attachment[];
  attachmentBase?: string;
  tag?: string;
}) {
  return (
    <li className={cx("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "min-w-0 max-w-[min(42rem,92%)] rounded-xl border px-4 py-3",
          internal
            ? "border-amber-300 bg-amber-50"
            : role === "admin"
              ? "border-indigo-100 bg-indigo-50/60"
              : "border-slate-200 bg-white",
        )}
      >
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-semibold text-slate-800">{senderLabel}</span>
          <time className="text-slate-500" dateTime={createdAt}>
            {formatDateTime(createdAt)}
          </time>
          {tag && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{tag}</span>}
          {internal && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-200/70 px-1.5 py-0.5 font-medium text-amber-900">
              <Lock className="size-3" aria-hidden /> Internal note (not visible to author)
            </span>
          )}
          {aiAssisted && (
            <span className="inline-flex items-center gap-1 text-violet-600">
              <Sparkles className="size-3" aria-hidden /> AI-assisted
            </span>
          )}
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{body}</p>
        {attachments && attachmentBase && <Attachments items={attachments} baseUrl={attachmentBase} />}
      </div>
    </li>
  );
}
