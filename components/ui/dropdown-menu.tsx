"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: DropdownMenuPrimitive.DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-[90] min-w-52 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-1.5 text-[var(--foreground)] shadow-[var(--shadow-sheet)]",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: DropdownMenuPrimitive.DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 text-[15px] font-medium outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}
