import type { ReactNode } from "react";

type SidebarProps = {
  children: ReactNode;
  className?: string;
};

type SidebarSectionProps = {
  children: ReactNode;
  className?: string;
};

export function Sidebar({ children, className = "" }: SidebarProps) {
  return (
    <aside
      className={`flex h-screen w-72 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ children, className = "" }: SidebarSectionProps) {
  return <div className={`border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 ${className}`}>{children}</div>;
}

export function SidebarContent({ children, className = "" }: SidebarSectionProps) {
  return <div className={`flex-1 p-3 ${className}`}>{children}</div>;
}

export function SidebarFooter({ children, className = "" }: SidebarSectionProps) {
  return <div className={`border-t border-zinc-200 p-4 dark:border-zinc-800 ${className}`}>{children}</div>;
}

