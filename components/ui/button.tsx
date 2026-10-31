import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
  secondary: "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-border)]",
  outline:
    "border-[1.5px] border-[var(--foreground)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--muted)]",
  ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
  destructive: "bg-[var(--destructive-bg)] text-[var(--destructive-fg)] hover:bg-[var(--destructive-hover)]",
};

// 44px default target; `sm` stays at 36px for dense staff tables only.
const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-4 text-[15px]",
  sm: "h-9 px-3 text-sm",
  icon: "h-11 w-11",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
