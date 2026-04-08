"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Users,
} from "lucide-react";

import type { CurrentUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";
import { getMenuItemsForRole } from "@/lib/navigation";
import { sanitizeSiteLogoSvg } from "@/lib/site-logo";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";

type AppSidebarProps = {
  user: CurrentUser;
  locale: Locale;
  siteName: string;
  siteLogoSvg: string;
  labels: {
    signedInAs: string;
    logout: string;
    localeLabel: string;
    settingsSection: string;
    nav: Record<
      "dashboard" | "courses" | "lessons" | "bookings" | "users" | "reports" | "registries" | "siteSettings",
      string
    >;
  };
};

export function AppSidebar({ user, locale, siteName, siteLogoSvg, labels }: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setIsMobile(media.matches);
      if (!media.matches) setIsMobileOpen(false);
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const isDesktopCollapsed = !isMobile && isCollapsed;
  const sidebarOpen = isMobile ? isMobileOpen : true;

  const iconByKey = {
    dashboard: LayoutDashboard,
    courses: BookOpen,
    lessons: ClipboardList,
    bookings: CalendarDays,
    users: Users,
    reports: BarChart3,
    siteSettings: Settings2,
    registries: Settings2,
  };

  function toggleSidebar() {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev);
      return;
    }
    setIsCollapsed((prev) => !prev);
  }

  const menuItems = getMenuItemsForRole(user.role);
  const mainMenuItems = menuItems.filter((item) => !item.href.startsWith("/settings"));
  const settingsMenuItems = menuItems.filter((item) => item.href.startsWith("/settings"));
  const safeLogoSrc = sanitizeSiteLogoSvg(siteLogoSvg);

  return (
    <>
      <Link
        href={withLocalePath(locale, "/")}
        className="fixed left-3 top-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        aria-label="Home"
      >
        <Image src={safeLogoSrc} alt="NekoGym logo" width={20} height={20} />
      </Link>

      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed right-3 top-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 md:hidden"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
      </button>

      {isMobile && sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}

    <Sidebar
      className={[
        "fixed left-0 top-0 z-40 h-screen transition-all duration-200 md:sticky md:top-0",
        isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        isDesktopCollapsed ? "w-72 md:w-16" : "w-72",
      ].join(" ")}
    >
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Image src={safeLogoSrc} alt="NekoGym logo" width={20} height={20} />
            {!isDesktopCollapsed ? <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{siteName}</h1> : null}
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 md:inline-flex"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav className="space-y-1">
          {mainMenuItems.map((item) => {
            const href = withLocalePath(locale, item.href);
            const isActive = pathname === href;
            const Icon = iconByKey[item.key];

            return (
              <Link
                key={item.href}
                href={href}
                title={labels.nav[item.key]}
                className={[
                  "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                  isDesktopCollapsed ? "justify-center" : "gap-2",
                  isActive
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-200 dark:hover:bg-zinc-800",
                ].join(" ")}
                  onClick={() => {
                    if (isMobile) setIsMobileOpen(false);
                  }}
              >
                <Icon size={16} />
                {!isDesktopCollapsed ? labels.nav[item.key] : null}
              </Link>
            );
          })}

          {settingsMenuItems.length > 0 ? (
            <div className="pt-4">
              {!isDesktopCollapsed ? (
                <p className="px-3 pb-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {labels.settingsSection}
                </p>
              ) : null}
              {settingsMenuItems.map((item) => {
                const href = withLocalePath(locale, item.href);
                const isActive = pathname === href;
                const Icon = iconByKey[item.key];

                return (
                  <Link
                    key={item.href}
                    href={href}
                    title={labels.nav[item.key]}
                    className={[
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      isDesktopCollapsed ? "justify-center" : "gap-2",
                      isActive
                        ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-700 hover:bg-zinc-200/70 dark:text-zinc-200 dark:hover:bg-zinc-800",
                    ].join(" ")}
                    onClick={() => {
                      if (isMobile) setIsMobileOpen(false);
                    }}
                  >
                    <Icon size={16} />
                    {!isDesktopCollapsed ? labels.nav[item.key] : null}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <div
          className={[
            "mb-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400",
            isDesktopCollapsed ? "justify-center" : "",
          ].join(" ")}
        >
          {!isDesktopCollapsed ? <span>{labels.localeLabel}</span> : null}
          <Link href={withLocalePath("it", "/")} className={pathname?.startsWith("/it") ? "font-semibold" : ""}>
            IT
          </Link>
          <span>/</span>
          <Link href={withLocalePath("en", "/")} className={pathname?.startsWith("/en") ? "font-semibold" : ""}>
            EN
          </Link>
        </div>

        {!isDesktopCollapsed ? <p className="text-xs text-zinc-500 dark:text-zinc-400">{labels.signedInAs}</p> : null}
        {!isDesktopCollapsed ? <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p> : null}
        {!isDesktopCollapsed ? <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">{user.email}</p> : null}
        <p
          className={[
            "mt-2 inline-flex rounded-md bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
            isDesktopCollapsed ? "mx-auto" : "",
          ].join(" ")}
        >
          {user.role}
        </p>
        <Link
          href={withLocalePath(locale, "/logout")}
          className={[
            "mt-3 inline-flex text-sm text-zinc-700 hover:underline dark:text-zinc-200",
            isDesktopCollapsed ? "mx-auto items-center justify-center" : "items-center gap-1",
          ].join(" ")}
          title={labels.logout}
        >
          <LogOut size={16} />
          {!isDesktopCollapsed ? labels.logout : null}
        </Link>
      </SidebarFooter>
    </Sidebar>
    </>
  );
}

