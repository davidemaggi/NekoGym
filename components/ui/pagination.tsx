import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

export function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav role="navigation" aria-label="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
}

export function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

export function PaginationItem(props: React.ComponentProps<"li">) {
  return <li {...props} />;
}

type PaginationLinkProps = React.ComponentProps<"button"> & {
  isActive?: boolean;
};

export function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 min-w-11 items-center justify-center rounded-xl border-[1.5px] px-3.5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "border-[var(--surface-border)] bg-[var(--surface)] hover:border-[var(--foreground)]",
        className
      )}
      {...props}
    />
  );
}

export function PaginationPrevious({ className, label = "Previous", ...props }: React.ComponentProps<typeof PaginationLink> & { label?: string }) {
  return (
    <PaginationLink className={cn("gap-1 pl-2.5", className)} {...props}>
      <ChevronLeft size={18} aria-hidden="true" />
      <span>{label}</span>
    </PaginationLink>
  );
}

export function PaginationNext({ className, label = "Next", ...props }: React.ComponentProps<typeof PaginationLink> & { label?: string }) {
  return (
    <PaginationLink className={cn("gap-1 pr-2.5", className)} {...props}>
      <span>{label}</span>
      <ChevronRight size={18} aria-hidden="true" />
    </PaginationLink>
  );
}

export function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
    </span>
  );
}
