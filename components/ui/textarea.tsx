import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-24 w-full rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] px-3.5 py-2.5 text-base text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)] focus-visible:border-[var(--ring)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-70",
          className
        )}
        {...props}
      />
    );
  }
);
