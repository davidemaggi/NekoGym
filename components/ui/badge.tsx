import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--muted)] text-[var(--foreground)]",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

