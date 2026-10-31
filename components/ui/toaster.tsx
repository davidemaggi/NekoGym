"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border !border-[var(--rule)] !bg-[var(--surface)] !text-[var(--foreground)] !shadow-[var(--shadow-sheet)] !font-sans !text-[15px]",
          description: "!text-[var(--muted-foreground)]",
          success: "[&_[data-icon]]:!text-[var(--success-fg)]",
          error: "[&_[data-icon]]:!text-[var(--danger-fg)]",
          closeButton: "!bg-[var(--surface)] !border-[var(--rule)] !text-[var(--muted-foreground)]",
        },
      }}
    />
  );
}
