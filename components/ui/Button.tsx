import Link from "next/link";
import { forwardRef } from "react";
import { LoaderCircle } from "lucide-react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "ai" | "danger-outline" | "success-outline" | "ai-outline";
type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300",
  secondary: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 disabled:text-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 disabled:text-slate-300",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-red-300",
  ai: "bg-violet-600 text-white shadow-sm hover:bg-violet-700 disabled:bg-violet-300",
  "danger-outline": "border border-red-200 bg-white text-red-700 shadow-sm hover:border-red-300 hover:bg-red-50 disabled:text-red-300",
  "success-outline": "border border-emerald-200 bg-white text-emerald-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 disabled:text-emerald-300",
  "ai-outline": "border border-violet-200 bg-white text-violet-700 shadow-sm hover:border-violet-300 hover:bg-violet-50 disabled:text-violet-300",
};

const SIZES: Record<ButtonSize, string> = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm" };

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, className, children, disabled, ...props },
  ref,
) {
  return (
    <button ref={ref} disabled={disabled || loading} className={cx(base, "disabled:cursor-not-allowed", SIZES[size], VARIANTS[variant], className)} {...props}>
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

export function ButtonLink({ href, children, variant = "primary", size = "md", icon }: ButtonLinkProps) {
  return (
    <Link href={href} className={cx(base, SIZES[size], VARIANTS[variant])}>
      {icon}
      {children}
    </Link>
  );
}
