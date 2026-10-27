"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cx } from "./cx";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

const MENU_MAX_HEIGHT = 288;
const MENU_MAX_WIDTH = 320;

export function Select<T extends string>({
  value,
  onChange,
  options,
  id,
  placeholder = "Select…",
  invalid,
  disabled,
  size = "md",
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: SelectProps<T>) {
  const autoId = useId();
  const triggerId = id || `select-${autoId}`;
  const listId = `${triggerId}-listbox`;
  const optionId = (i: number) => `${triggerId}-opt-${i}`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const openMenu = (startAt?: number) => {
    if (disabled || !options.length) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < MENU_MAX_HEIGHT + 16 && rect.top > below);
      setAlignRight(rect.left + MENU_MAX_WIDTH > window.innerWidth - 16);
    }
    setActive(startAt ?? Math.max(0, selectedIndex));
    setOpen(true);
  };

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const choose = (i: number) => {
    const option = options[i];
    if (option && option.value !== value) onChange(option.value);
    close();
  };

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${triggerId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, triggerId]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const typeahead = (key: string) => {
    const k = key.toLowerCase();
    const n = options.length;
    for (let step = 1; step <= n; step++) {
      const i = (active + step) % n;
      if (options[i].label.toLowerCase().startsWith(k)) return i;
    }
    return -1;
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const i = typeahead(e.key);
          if (i >= 0) setActive(i);
        }
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openMenu(e.key === "ArrowUp" ? Math.max(0, selectedIndex - 1) : undefined);
    }
  };

  return (
    <div ref={wrapperRef} className={cx("relative", className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={cx(
          "flex w-full items-center justify-between gap-2 rounded-lg border bg-white pr-2.5 pl-3 text-left text-sm transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          size === "sm" ? "h-9" : "h-10",
          invalid ? "border-red-400" : open ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-300 hover:border-slate-400",
        )}
      >
        <span className={cx("truncate", selected ? "text-slate-900" : "text-slate-400")}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cx("size-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={triggerId}
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKeyDown}
          className={cx(
            "absolute z-40 max-h-72 w-max min-w-full max-w-80 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg focus:outline-none",
            dropUp ? "bottom-full mb-1" : "top-full mt-1",
            alignRight ? "right-0" : "left-0",
          )}
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value || `__empty-${i}`}
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={cx(
                  "flex cursor-pointer items-start justify-between gap-3 rounded-md px-3 py-2 text-sm",
                  i === active ? "bg-indigo-50 text-indigo-900" : "text-slate-700",
                )}
              >
                <span className="min-w-0">
                  <span className={cx("block", isSelected && "font-medium text-indigo-700")}>{o.label}</span>
                  {o.description && <span className="block text-xs text-slate-500">{o.description}</span>}
                </span>
                <Check className={cx("mt-0.5 size-4 shrink-0 text-indigo-600", !isSelected && "invisible")} aria-hidden />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
