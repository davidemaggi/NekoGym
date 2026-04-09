import type { ButtonHTMLAttributes, LiHTMLAttributes, ReactNode, UlHTMLAttributes } from "react";

type SidebarProps = {
  children: ReactNode;
  className?: string;
};

type SidebarSectionProps = {
  children: ReactNode;
  className?: string;
};

type SidebarMenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

type SidebarMenuListProps = {
  children: ReactNode;
  className?: string;
} & UlHTMLAttributes<HTMLUListElement>;

type SidebarMenuItemProps = {
  children: ReactNode;
  className?: string;
} & LiHTMLAttributes<HTMLLIElement>;

export function Sidebar({ children, className = "" }: SidebarProps) {
  return (
    <aside
      className={`flex h-screen w-72 shrink-0 flex-col border-r border-[var(--surface-border)] bg-[var(--surface)] ${className}`}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ children, className = "" }: SidebarSectionProps) {
  return <div className={`border-b border-[var(--surface-border)] px-5 py-4 ${className}`}>{children}</div>;
}

export function SidebarContent({ children, className = "" }: SidebarSectionProps) {
  return <div className={`flex-1 p-3 ${className}`}>{children}</div>;
}

export function SidebarFooter({ children, className = "" }: SidebarSectionProps) {
  return <div className={`border-t border-[var(--surface-border)] p-4 ${className}`}>{children}</div>;
}

export function SidebarMenu({ children, className = "", ...props }: SidebarMenuListProps) {
  return (
    <ul className={`space-y-1 ${className}`} {...props}>
      {children}
    </ul>
  );
}

export function SidebarMenuItem({ children, className = "", ...props }: SidebarMenuItemProps) {
  return (
    <li className={className} {...props}>
      {children}
    </li>
  );
}

export function SidebarMenuButton({ children, className = "", type = "button", ...props }: SidebarMenuButtonProps) {
  return (
    <button
      type={type}
      className={`flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarMenuSub({ children, className = "", ...props }: SidebarMenuListProps) {
  return (
    <ul className={`mt-1 space-y-1 border-l border-[var(--surface-border)] pl-3 ${className}`} {...props}>
      {children}
    </ul>
  );
}

export function SidebarMenuSubItem({ children, className = "", ...props }: SidebarMenuItemProps) {
  return (
    <li className={className} {...props}>
      {children}
    </li>
  );
}

