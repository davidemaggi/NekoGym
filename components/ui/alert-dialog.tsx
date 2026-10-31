"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export function AlertDialogContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" />
      <AlertDialogPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 w-full rounded-t-3xl bg-[var(--surface)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-sheet)] outline-none",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6",
          className
        )}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogHeader({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  return <AlertDialogPrimitive.Title className="text-xl font-bold leading-tight text-balance">{children}</AlertDialogPrimitive.Title>;
}

export function AlertDialogDescription({ children }: { children: ReactNode }) {
  return <AlertDialogPrimitive.Description className="text-[15px] text-[var(--muted-foreground)]">{children}</AlertDialogPrimitive.Description>;
}

export function AlertDialogFooter({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>;
}
