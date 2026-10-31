"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  ChevronsUpDown,
  ClipboardList,
  House,
  LogOut,
  Megaphone,
  Menu,
  Settings2,
  Table2,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { CurrentUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";
import { getMenuItemsForRole, type AppMenuItem } from "@/lib/navigation";
import { sanitizeSiteLogoSvg } from "@/lib/site-logo";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocalNotificationsBadge, LocalNotificationsLiveProvider } from "@/components/layout/local-notifications-live";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MenuKey = AppMenuItem["key"];
type Stock = "mint" | "azzurro" | "giallino" | "rosa" | "lilla" | "carta";

type AppShellProps = {
  user: CurrentUser;
  locale: Locale;
  siteName: string;
  siteLogoSvg: string;
  appVersion: string;
  children: ReactNode;
  labels: {
    signedInAs: string;
    logout: string;
    localeLabel: string;
    themeLabel: string;
    themeToLight: string;
    themeToDark: string;
    settingsSection: string;
    menu: string;
    primaryNav: string;
    skipToContent: string;
    unreadNotifications: string;
    nav: Record<MenuKey, string>;
  };
};

const ICONS: Record<MenuKey, LucideIcon> = {
  dashboard: House,
  courses: BookOpen,
  lessons: ClipboardList,
  bookings: CalendarCheck,
  users: Users,
  reports: BarChart3,
  myNotifications: Bell,
  profileSettings: UserCog,
  siteSettings: Settings2,
  dangerZone: AlertTriangle,
  manualNotifications: Megaphone,
  registries: Table2,
};

// One ticket stock per section: the current one tints the shell header.
const STOCK_BY_KEY: Record<MenuKey, Stock> = {
  dashboard: "carta",
  bookings: "mint",
  lessons: "azzurro",
  courses: "giallino",
  users: "rosa",
  reports: "lilla",
  myNotifications: "giallino",
  profileSettings: "carta",
  siteSettings: "carta",
  dangerZone: "rosa",
  manualNotifications: "lilla",
  registries: "giallino",
};

// Bottom bar: four destinations per role, the rest lives in the menu sheet.
const PRIMARY_BY_ROLE: Record<CurrentUser["role"], MenuKey[]> = {
  TRAINEE: ["dashboard", "bookings", "myNotifications", "profileSettings"],
  TRAINER: ["dashboard", "bookings", "lessons", "courses"],
  ADMIN: ["dashboard", "bookings", "lessons", "users"],
};

const ROLE_LABEL: Record<"it" | "en", Record<CurrentUser["role"], string>> = {
  it: { ADMIN: "Admin", TRAINER: "Trainer", TRAINEE: "Iscritto" },
  en: { ADMIN: "Admin", TRAINER: "Trainer", TRAINEE: "Member" },
};

function stripLocale(pathname: string, locale: string) {
  const rest = pathname.slice(`/${locale}`.length);
  return rest === "" ? "/" : rest;
}

function isItemActive(itemHref: string, path: string) {
  if (itemHref === "/") return path === "/";
  return path === itemHref || path.startsWith(`${itemHref}/`);
}

function stockForPath(path: string, items: AppMenuItem[]): Stock {
  const match = items
    .filter((item) => isItemActive(item.href, path))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ? STOCK_BY_KEY[match.key] : "carta";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({ user, locale, siteName, siteLogoSvg, appVersion, children, labels }: AppShellProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const path = stripLocale(pathname, locale);
  const [menuOpen, setMenuOpen] = useState(false);

  const items = getMenuItemsForRole(user.role);
  const mainItems = items.filter((item) => !item.href.startsWith("/settings"));
  const settingsItems = items
    .filter((item) => item.href.startsWith("/settings"))
    .sort((a, b) => Number(a.key === "dangerZone") - Number(b.key === "dangerZone"));
  const primaryKeys = PRIMARY_BY_ROLE[user.role].filter((key) => items.some((item) => item.key === key));
  const primaryItems = primaryKeys.map((key) => items.find((item) => item.key === key)!);
  const stock = stockForPath(path, items);
  const safeLogoSrc = sanitizeSiteLogoSvg(siteLogoSvg);
  const roleLabel = ROLE_LABEL[locale === "en" ? "en" : "it"][user.role];
  const otherLocale: Locale = locale === "it" ? "en" : "it";
  const switchLocaleHref = withLocalePath(otherLocale, path);
  const notificationsHref = withLocalePath(locale, "/my-notifications");

  function renderNavLink(item: AppMenuItem, onNavigate?: () => void) {
    const Icon = ICONS[item.key];
    const active = isItemActive(item.href, path);
    const danger = item.key === "dangerZone";
    return (
      <Link
        href={withLocalePath(locale, item.href)}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        data-stock={STOCK_BY_KEY[item.key]}
        className={cn(
          "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors",
          active
            ? "bg-[var(--stock)] text-[var(--stock-ink)]"
            : danger
              ? "text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]"
              : "text-[var(--sidebar-link)] hover:bg-[var(--sidebar-link-hover)]"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            active ? "bg-[var(--surface)]/70" : "bg-[var(--stock)]"
          )}
        >
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1 truncate">{labels.nav[item.key]}</span>
        {item.key === "myNotifications" ? <LocalNotificationsBadge srLabel={labels.unreadNotifications} /> : null}
      </Link>
    );
  }

  const brand = (
    <span className="flex min-w-0 items-center gap-2.5">
      <Image src={safeLogoSrc} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-lg object-contain" />
      <span className="truncate text-[17px] font-bold">{siteName}</span>
    </span>
  );

  const preferences = (
    <div className="flex items-center justify-between gap-2">
      <ThemeToggle
        labels={{ themeLabel: labels.themeLabel, themeToLight: labels.themeToLight, themeToDark: labels.themeToDark }}
      />
      <Link
        href={switchLocaleHref}
        hrefLang={otherLocale}
        className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[var(--sidebar-link)] transition-colors hover:bg-[var(--sidebar-link-hover)]"
      >
        <span className="sr-only">{labels.localeLabel}: </span>
        <span aria-hidden={locale !== "it"} className={locale === "it" ? "text-[var(--foreground)]" : "opacity-60"}>IT</span>
        <span aria-hidden="true" className="opacity-40">/</span>
        <span aria-hidden={locale !== "en"} className={locale === "en" ? "text-[var(--foreground)]" : "opacity-60"}>EN</span>
      </Link>
    </div>
  );

  return (
    <LocalNotificationsLiveProvider>
      <a
        href="#content"
        className="sr-only z-[100] rounded-xl bg-[var(--primary)] px-4 py-3 font-semibold text-[var(--primary-foreground)] focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        {labels.skipToContent}
      </a>

      <div className="flex min-h-dvh" data-stock={stock}>
        {/* Desktop rail */}
        <aside className="sticky top-0 hidden h-dvh w-[17rem] shrink-0 flex-col border-r border-[var(--rule)] bg-[var(--surface)] lg:flex">
          <div className="flex h-16 items-center px-5">{brand}</div>

          <nav aria-label={labels.primaryNav} className="flex-1 overflow-y-auto px-3 pb-4">
            <ul className="space-y-1">
              {mainItems.map((item) => (
                <li key={item.key}>
                  {renderNavLink(item)}
                </li>
              ))}
            </ul>
            {settingsItems.length > 0 ? (
              <div className="mt-6">
                <p className="px-3 pb-2 text-[13px] font-semibold text-[var(--muted-foreground)]">{labels.settingsSection}</p>
                <ul className="space-y-1">
                  {settingsItems.map((item) => (
                    <li key={item.key}>
                      {renderNavLink(item)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </nav>

          <div className="space-y-2 border-t border-[var(--rule)] p-3">
            {preferences}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`${labels.signedInAs} ${user.name}`}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[var(--sidebar-link-hover)]"
                >
                  <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--stock-lilla)] text-sm font-bold text-[var(--stock-ink)]">
                    {initials(user.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{user.name}</span>
                    <span className="block truncate text-[13px] text-[var(--muted-foreground)]">{roleLabel} · {user.email}</span>
                  </span>
                  <ChevronsUpDown size={16} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-60">
                <DropdownMenuItem asChild>
                  <Link href={withLocalePath(locale, "/settings/profile")}>
                    <UserCog size={16} aria-hidden="true" />
                    {labels.nav.profileSettings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={withLocalePath(locale, "/logout")}>
                    <LogOut size={16} aria-hidden="true" />
                    {labels.logout}
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="tabular px-2 text-xs text-[var(--muted-foreground)]">NekoGym v{appVersion}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar on the section stock */}
          <header className="sticky top-0 z-30 bg-[var(--stock)] pt-[env(safe-area-inset-top)] lg:hidden">
            <div className="flex h-14 items-center justify-between gap-2 pl-4 pr-1.5">
              <Link href={withLocalePath(locale, "/")} className="min-w-0 text-[var(--stock-ink)]">
                {brand}
              </Link>
              {/* Only when the tab bar has no Notifiche tab of its own (staff roles). */}
              {primaryKeys.includes("myNotifications") ? null : (
              <Link
                href={notificationsHref}
                aria-label={labels.nav.myNotifications}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--stock-ink)] transition-colors hover:bg-[var(--surface)]/60"
              >
                <Bell size={20} aria-hidden="true" />
                <LocalNotificationsBadge srLabel={labels.unreadNotifications} className="absolute right-1 top-1" />
              </Link>
              )}
            </div>
          </header>

          <main id="content" tabIndex={-1} className="relative min-w-0 flex-1 overflow-x-clip bg-[var(--paper)] outline-none">
            <div aria-hidden="true" data-shell-band className="absolute inset-x-0 top-0 h-44 bg-[var(--stock)] lg:h-60" />
            <div className="relative mx-auto w-full max-w-6xl px-4 pb-32 pt-4 sm:px-6 lg:px-10 lg:pb-14 lg:pt-10">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <nav
        aria-label={labels.primaryNav}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--rule)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-xl">
          {primaryItems.map((item) => {
            const Icon = ICONS[item.key];
            const active = isItemActive(item.href, path);
            return (
              <li key={item.key} className="flex-1">
                <Link
                  href={withLocalePath(locale, item.href)}
                  aria-current={active ? "page" : undefined}
                  data-stock={STOCK_BY_KEY[item.key]}
                  className={cn(
                    "flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 text-xs font-semibold",
                    active ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative inline-flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                      active ? "bg-[var(--stock)] text-[var(--stock-ink)]" : ""
                    )}
                  >
                    <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                    {item.key === "myNotifications" ? (
                      <LocalNotificationsBadge srLabel={labels.unreadNotifications} className="absolute -right-0.5 -top-1" />
                    ) : null}
                  </span>
                  <span className="max-w-full truncate px-1">{labels.nav[item.key]}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className="flex min-h-[3.75rem] w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold text-[var(--muted-foreground)]"
            >
              <span aria-hidden="true" className="inline-flex h-8 w-14 items-center justify-center rounded-full">
                <Menu size={21} />
              </span>
              <span>{labels.menu}</span>
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="lg:hidden">
          <DialogTitle>{labels.menu}</DialogTitle>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--surface-sunken)] p-3">
            <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--stock-lilla)] font-bold text-[var(--stock-ink)]">
              {initials(user.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{user.name}</span>
              <span className="block truncate text-sm text-[var(--muted-foreground)]">{roleLabel} · {user.email}</span>
            </span>
          </div>
          <nav aria-label={labels.menu} className="mt-4">
            <ul className="space-y-1">
              {mainItems.map((item) => (
                <li key={item.key}>
                  {renderNavLink(item, () => setMenuOpen(false))}
                </li>
              ))}
            </ul>
            {settingsItems.length > 0 ? (
              <>
                <p className="px-3 pb-2 pt-5 text-[13px] font-semibold text-[var(--muted-foreground)]">{labels.settingsSection}</p>
                <ul className="space-y-1">
                  {settingsItems.map((item) => (
                    <li key={item.key}>
                      {renderNavLink(item, () => setMenuOpen(false))}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </nav>
          <div className="mt-5 space-y-2 border-t border-[var(--rule)] pt-4">
            {preferences}
            <a
              href={withLocalePath(locale, "/logout")}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold text-[var(--danger-fg)] transition-colors hover:bg-[var(--danger-bg)]"
            >
              <LogOut size={18} aria-hidden="true" />
              {labels.logout}
            </a>
            <p className="tabular px-3 text-xs text-[var(--muted-foreground)]">NekoGym v{appVersion}</p>
          </div>
        </DialogContent>
      </Dialog>
    </LocalNotificationsLiveProvider>
  );
}
