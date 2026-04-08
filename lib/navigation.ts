import type { UserRole } from "@/lib/auth";

export type AppMenuItem = {
  key: "dashboard" | "courses" | "lessons" | "bookings" | "users" | "reports" | "registries" | "siteSettings";
  href: string;
  allowedRoles: UserRole[];
};

export const appMenuItems: AppMenuItem[] = [
  { key: "dashboard", href: "/", allowedRoles: ["ADMIN", "TRAINER", "TRAINEE"] },
  { key: "courses", href: "/courses", allowedRoles: ["ADMIN", "TRAINER"] },
  { key: "lessons", href: "/lessons", allowedRoles: ["ADMIN", "TRAINER"] },
  { key: "bookings", href: "/bookings", allowedRoles: ["ADMIN", "TRAINER", "TRAINEE"] },
  { key: "users", href: "/users", allowedRoles: ["ADMIN"] },
  { key: "reports", href: "/reports", allowedRoles: ["ADMIN"] },
  { key: "siteSettings", href: "/settings/site", allowedRoles: ["ADMIN"] },
  { key: "registries", href: "/settings/registries", allowedRoles: ["ADMIN", "TRAINER"] },
];

export function getMenuItemsForRole(role: UserRole): AppMenuItem[] {
  return appMenuItems.filter((item) => item.allowedRoles.includes(role));
}


