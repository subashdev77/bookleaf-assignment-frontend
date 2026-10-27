"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";
import { cx } from "./cx";

function useNativeDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return ref;
}

const dialogBase = "m-auto w-[calc(100%-2rem)] rounded-xl border border-slate-200 p-0 shadow-xl backdrop:bg-slate-900/40";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "md" | "lg";
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const ref = useNativeDialog(open);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="modal-title"
      className={cx(dialogBase, size === "lg" ? "max-w-2xl" : "max-w-lg")}
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 id="modal-title" className="text-base font-semibold text-slate-900">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", tone = "primary", loading, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useNativeDialog(open);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className={cx(dialogBase, "max-w-md")}
    >
      <div className="p-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <div className="mt-2 text-sm text-slate-600">{description}</div>}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={tone} onClick={onConfirm} loading={loading} autoFocus>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
