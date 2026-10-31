import * as React from "react";

import { cn } from "@/lib/utils";

// 16px text avoids iOS zoom on focus; 44px height is the touch floor.
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] px-3.5 text-base text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)] focus-visible:border-[var(--ring)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--ring)] disabled:cursor-not-allowed disabled:bg-[var(--surface-sunken)] disabled:opacity-70 aria-[invalid=true]:border-[var(--danger-fg)]",
          className
        )}
        {...props}
      />
    );
  }
);
