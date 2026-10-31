import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--muted)] text-[var(--foreground)]",
  info: "bg-[var(--info-bg)] text-[var(--info-fg)]",
  success: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
  danger: "bg-[var(--danger-bg)] text-[var(--danger-fg)]",
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
        "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[13px] font-semibold",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
