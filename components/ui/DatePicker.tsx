"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cx } from "./cx";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const POPOVER_HEIGHT = 290;
const POPOVER_WIDTH = 256;

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function fromIso(value: string | null | undefined): Date | null {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), lastDay));
};

function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - offset + i));
  return days[35].getMonth() === month ? days : days.slice(0, 35);
}

const formatLabel = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function DatePicker({ value, onChange, id, placeholder = "Select date", min, max, invalid, disabled, className, "aria-label": ariaLabel }: DatePickerProps) {
  const autoId = useId();
  const triggerId = id || `date-${autoId}`;
  const selected = fromIso(value);
  const minDate = fromIso(min);
  const maxDate = fromIso(max);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<Date>(selected || today);
  const [placement, setPlacement] = useState({ up: false, right: false });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const isDisabled = (d: Date) => (!!minDate && d < minDate) || (!!maxDate && d > maxDate);

  const openPicker = () => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setPlacement({
        up: below < POPOVER_HEIGHT + 16 && rect.top > below,
        right: rect.left + POPOVER_WIDTH > window.innerWidth - 16,
      });
    }
    setFocused(selected || today);
    setOpen(true);
  };

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const pick = (d: Date) => {
    if (isDisabled(d)) return;
    onChange(toIso(d));
    close();
  };

  useEffect(() => {
    if (!open) return;
    gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
  }, [open, focused]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
      Home: () => addDays(focused, -((focused.getDay() + 6) % 7)),
      End: () => addDays(focused, 6 - ((focused.getDay() + 6) % 7)),
    };
    if (moves[e.key]) {
      e.preventDefault();
      setFocused(moves[e.key]());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(focused);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  const days = monthGrid(focused.getFullYear(), focused.getMonth());

  return (
    <div ref={wrapperRef} className={cx("relative", className)}>
      <div
        className={cx(
          "flex h-10 w-full items-center rounded-lg border bg-white text-sm transition-colors",
          disabled ? "bg-slate-50 text-slate-400" : "",
          invalid ? "border-red-400" : open ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-300 hover:border-slate-400",
        )}
      >
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={ariaLabel ? `${ariaLabel}${selected ? `: ${formatLabel(selected)}` : ""}` : undefined}
          onClick={() => (open ? close() : openPicker())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-lg pl-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed"
        >
          <CalendarDays className="size-4 shrink-0 text-slate-400" aria-hidden />
          <span className={cx("truncate", selected ? "text-slate-900" : "text-slate-400")}>{selected ? formatLabel(selected) : placeholder}</span>
        </button>
        {selected && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear date"
            className="mr-1.5 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Choose date"
          className={cx(
            "absolute z-40 w-64 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg",
            placement.up ? "bottom-full mb-1" : "top-full mt-1",
            placement.right ? "right-0" : "left-0",
          )}
        >
          <div className="mb-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFocused(addMonths(focused, -1))}
              aria-label="Previous month"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-semibold text-slate-900" aria-live="polite">
              {MONTHS[focused.getMonth()]} {focused.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() => setFocused(addMonths(focused, 1))}
              aria-label="Next month"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-0.5">
                {d}
              </span>
            ))}
          </div>

          <div ref={gridRef} role="grid" onKeyDown={onGridKeyDown} className="grid grid-cols-7 gap-0.5">
            {days.map((d) => {
              const inMonth = d.getMonth() === focused.getMonth();
              const isSelected = sameDay(d, selected);
              const isToday = sameDay(d, today);
              const isFocused = sameDay(d, focused);
              const off = isDisabled(d);
              return (
                <button
                  key={toIso(d)}
                  type="button"
                  role="gridcell"
                  tabIndex={isFocused ? 0 : -1}
                  data-focused={isFocused}
                  aria-selected={isSelected}
                  aria-label={formatLabel(d)}
                  disabled={off}
                  onClick={() => pick(d)}
                  className={cx(
                    "flex h-8 items-center justify-center rounded-md text-[13px] tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    isSelected
                      ? "bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
                      : off
                        ? "cursor-not-allowed text-slate-300"
                        : inMonth
                          ? "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                          : "text-slate-400 hover:bg-slate-50",
                    isToday && !isSelected && "font-semibold text-indigo-600 ring-1 ring-indigo-200 ring-inset",
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <button
              type="button"
              onClick={() => {
                onChange("");
                close();
              }}
              className="rounded-md px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={isDisabled(today)}
              onClick={() => pick(today)}
              className="rounded-md px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:text-slate-300"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
