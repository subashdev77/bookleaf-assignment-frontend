import { forwardRef } from "react";
import { cx } from "./cx";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, hint, children, required }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

const inputBase =
  "block w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-50";
const inputBorder = (invalid?: boolean) => (invalid ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-indigo-500");

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ invalid, className, ...props }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cx(inputBase, "h-10", inputBorder(invalid), className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, className, ...props }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cx(inputBase, "py-2", inputBorder(invalid), className)} {...props} />;
});
