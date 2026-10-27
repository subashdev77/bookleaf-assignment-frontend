"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Download, FileText, ImageOff, X } from "lucide-react";
import { formatBytes } from "@/lib/format";
import type { Attachment } from "@/lib/types";

const isImage = (a: Attachment) => a.contentType.startsWith("image/");

function shortName(name: string, max = 28) {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  return `${name.slice(0, max - ext.length - 1)}…${ext}`;
}

export function Attachments({ items, baseUrl }: { items: Attachment[]; baseUrl: string }) {
  const [preview, setPreview] = useState<Attachment | null>(null);
  if (!items.length) return null;

  const images = items.filter(isImage);
  const files = items.filter((a) => !isImage(a));
  const url = (a: Attachment) => `${baseUrl}/${a.id}`;

  return (
    <div className="mt-3 space-y-2">
      {images.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Image attachments">
          {images.map((a) => (
            <li key={a.id}>
              <Thumbnail src={url(a)} name={a.name} onOpen={() => setPreview(a)} />
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="File attachments">
          {files.map((a) => (
            <li key={a.id} className="min-w-0">
              <a
                href={url(a)}
                title={a.name}
                className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
              >
                <FileText className="size-4 shrink-0 text-red-500" aria-hidden />
                <span className="truncate">{shortName(a.name)}</span>
                <span className="shrink-0 text-slate-400">{formatBytes(a.size)}</span>
                <Download className="size-3.5 shrink-0" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
      <Lightbox attachment={preview} src={preview ? url(preview) : ""} onClose={() => setPreview(null)} />
    </div>
  );
}

function Thumbnail({ src, name, onOpen }: { src: string; name: string; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onOpen}
      title={name}
      aria-label={`View image ${name}`}
      className="group relative block h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      {failed ? (
        <span className="flex h-full flex-col items-center justify-center gap-1 text-xs text-slate-500">
          <ImageOff className="size-5" aria-hidden />
          Unavailable
        </span>
      ) : (
        <Image src={src} alt={name} fill unoptimized sizes="128px" onError={() => setFailed(true)} className="object-cover transition-transform group-hover:scale-105" />
      )}
      <span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/60 to-transparent px-2 pt-4 pb-1 text-left text-[11px] text-white">
        {shortName(name, 20)}
      </span>
    </button>
  );
}

function Lightbox({ attachment, src, onClose }: { attachment: Attachment | null; src: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (attachment && !d.open) d.showModal();
    if (!attachment && d.open) d.close();
  }, [attachment]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label={attachment ? `Image: ${attachment.name}` : "Image preview"}
      className="m-auto max-h-[92dvh] w-[min(64rem,calc(100%-2rem))] overflow-hidden rounded-xl bg-slate-950 p-0 shadow-2xl backdrop:bg-slate-950/80"
    >
      {attachment && (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5 text-sm text-white">
            <p className="min-w-0 flex-1 truncate" title={attachment.name}>
              {attachment.name} <span className="text-white/50">· {formatBytes(attachment.size)}</span>
            </p>
            <a href={src} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-white/80 hover:bg-white/10 hover:text-white">
              <Download className="size-4" aria-hidden /> Download
            </a>
            <button onClick={onClose} aria-label="Close preview" className="rounded-md p-1 text-white/80 hover:bg-white/10 hover:text-white">
              <X className="size-5" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-4">
            <Image src={src} alt={attachment.name} width={1600} height={1200} unoptimized className="h-auto max-h-[calc(92dvh-4rem)] w-auto max-w-full object-contain" />
          </div>
        </div>
      )}
    </dialog>
  );
}
