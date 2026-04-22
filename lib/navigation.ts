import type { UserRole } from "@/lib/auth";

export type AppMenuItem = {
  key:
    | "dashboard"
    | "courses"
    | "lessons"
    | "bookings"
    | "users"
    | "reports"
    | "myNotifications"
    | "registries"
    | "siteSettings"
    | "dangerZone"
    | "manualNotifications"
    | "profileSettings";
  href: string;
  allowedRoles: UserRole[];
};

export const appMenuItems: AppMenuItem[] = [
  { key: "dashboard", href: "/", allowedRoles: ["ADMIN", "TRAINER", "TRAINEE"] },
  { key: "courses", href: "/courses", allowedRoles: ["ADMIN", "TRAINER"] },
  { key: "lessons", href: "/lessons", allowedRoles: ["ADMIN", "TRAINER", "TRAINEE"] },
  { key: "bookings", href: "/bookings", allowedRoles: ["ADMIN", "TRAINER", "TRAINEE"] },
  { key: "users", href: "/users", allowedRoles: ["ADMIN"] },
  { key: "reports", href: "/reports", allowedRoles: ["ADMIN"] },
  { key: "myNotifications", href: "/my-notifications", allowedRoles: ["ADMIN", "TRAINER", "TRAINEE"] },
  { key: "profileSettings", href: "/settings/profile", allowedRoles: ["ADMIN", "TRAINER", "TRAINEE"] },
  { key: "siteSettings", href: "/settings/site", allowedRoles: ["ADMIN"] },
  { key: "dangerZone", href: "/settings/danger-zone", allowedRoles: ["ADMIN"] },
  { key: "manualNotifications", href: "/settings/notifications", allowedRoles: ["ADMIN"] },
  { key: "registries", href: "/settings/registries", allowedRoles: ["ADMIN", "TRAINER"] },
];

export function getMenuItemsForRole(role: UserRole): AppMenuItem[] {
  return appMenuItems.filter((item) => item.allowedRoles.includes(role));
}
