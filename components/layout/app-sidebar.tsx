"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  UserCog,
  Settings2,
  Table2,
  Users,
} from "lucide-react";

import type { CurrentUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";
import { getMenuItemsForRole } from "@/lib/navigation";
import { sanitizeSiteLogoSvg } from "@/lib/site-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocalNotificationsLive } from "@/components/layout/local-notifications-live";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type AppSidebarProps = {
  user: CurrentUser;
  locale: Locale;
  siteName: string;
  siteLogoSvg: string;
  labels: {
    signedInAs: string;
    logout: string;
    localeLabel: string;
    themeLabel: string;
    themeToLight: string;
    themeToDark: string;
    settingsSection: string;
    nav: Record<
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
      | "profileSettings",
      string
    >;
  };
};

export function AppSidebar({ user, locale, siteName, siteLogoSvg, labels }: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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
    myNotifications: Bell,
    profileSettings: UserCog,
    siteSettings: Settings2,
    dangerZone: AlertTriangle,
    manualNotifications: Megaphone,
    registries: Table2,
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
  const settingsBaseItems = settingsMenuItems.filter((item) => item.key !== "profileSettings");
  const settingsBaseItemsSorted = [...settingsBaseItems].sort((a, b) => {
    if (a.key === "dangerZone" && b.key !== "dangerZone") return 1;
    if (a.key !== "dangerZone" && b.key === "dangerZone") return -1;
    return 0;
  });
  const safeLogoSrc = sanitizeSiteLogoSvg(siteLogoSvg);
  const settingsPrefix = withLocalePath(locale, "/settings");
  const profileHref = withLocalePath(locale, "/settings/profile");
  const logoutHref = withLocalePath(locale, "/logout");
  const isProfileActive = pathname === profileHref;
  const isSettingsActive = pathname?.startsWith(settingsPrefix) ?? false;
  const isSettingsGroupActive = isSettingsActive;
  const isSettingsExpanded = isSettingsOpen || isSettingsActive;

  return (
    <>

      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[80] inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-md border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] md:hidden"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
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
        "fixed left-0 top-0 z-40 h-screen overflow-visible transition-all duration-200 md:sticky md:top-0",
        isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
        isDesktopCollapsed ? "w-72 md:w-16" : "w-72",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute left-full top-20 z-50 hidden h-10 w-8 -translate-x-px items-center justify-center rounded-r-md border border-l-0 border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] md:inline-flex"
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Image src={safeLogoSrc} alt="NekoGym logo" width={30} height={30} />
            {!isDesktopCollapsed ? <h1 className="text-lg font-semibold text-[var(--foreground)]">{siteName}</h1> : null}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav>
          <SidebarMenu>
            {mainMenuItems.map((item) => {
              const href = withLocalePath(locale, item.href);
              const isActive = pathname === href;
              const Icon = iconByKey[item.key];

              return (
                <SidebarMenuItem key={item.href}>
                  <Link
                    href={href}
                    title={labels.nav[item.key]}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                      isDesktopCollapsed ? "justify-center" : "gap-2",
                      isActive
                        ? "bg-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-fg)]"
                        : "text-[var(--sidebar-link)] hover:bg-[var(--sidebar-link-hover)]",
                    ].join(" ")}
                    onClick={() => {
                      if (isMobile) setIsMobileOpen(false);
                    }}
                  >
                    <Icon size={16} />
                    {!isDesktopCollapsed ? (
                      <span className="inline-flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate">{labels.nav[item.key]}</span>
                        {item.key === "myNotifications" ? <LocalNotificationsLive /> : null}
                      </span>
                    ) : item.key === "myNotifications" ? (
                      <LocalNotificationsLive />
                    ) : null}
                  </Link>
                </SidebarMenuItem>
              );
            })}

            {settingsMenuItems.length > 0 ? (
              <SidebarMenuItem className="pt-4">
                <SidebarMenuButton
                  onClick={() => {
                    if (isDesktopCollapsed) {
                      setIsCollapsed(false);
                      setIsSettingsOpen(true);
                      return;
                    }
                    setIsSettingsOpen((prev) => !prev);
                  }}
                  aria-expanded={isDesktopCollapsed ? false : isSettingsExpanded}
                  aria-controls="sidebar-settings-submenu"
                  aria-label={labels.settingsSection}
                  title={labels.settingsSection}
                  className={[
                    isDesktopCollapsed ? "justify-center" : "gap-2",
                    isSettingsGroupActive
                      ? "bg-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-fg)]"
                      : "text-[var(--sidebar-link)] hover:bg-[var(--sidebar-link-hover)]",
                  ].join(" ")}
                >
                  <Settings2 size={16} />
                  {!isDesktopCollapsed ? <span className="flex-1 text-left">{labels.settingsSection}</span> : null}
                  {!isDesktopCollapsed ? (
                    <ChevronDown
                      size={16}
                      className={isSettingsExpanded ? "rotate-180 transition-transform" : "transition-transform"}
                    />
                  ) : null}
                </SidebarMenuButton>

                {!isDesktopCollapsed && isSettingsExpanded ? (
                  <SidebarMenuSub id="sidebar-settings-submenu">
                    {settingsBaseItemsSorted.map((item) => {
                      const href = withLocalePath(locale, item.href);
                      const isActive = pathname === href;
                      const isDanger = item.key === "dangerZone";
                      const ItemIcon = iconByKey[item.key];

                      return (
                        <SidebarMenuSubItem key={item.href}>
                          <Link
                            href={href}
                            title={labels.nav[item.key]}
                            aria-current={isActive ? "page" : undefined}
                            className={[
                              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                              isDanger
                                ? isActive
                                  ? "bg-[var(--danger-bg)] text-[var(--danger-fg)]"
                                  : "text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]"
                                : isActive
                                  ? "bg-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-fg)]"
                                  : "text-[var(--sidebar-link)] hover:bg-[var(--sidebar-link-hover)]",
                            ].join(" ")}
                            onClick={() => {
                              if (isMobile) setIsMobileOpen(false);
                            }}
                          >
                            <ItemIcon size={14} />
                            <span>{labels.nav[item.key]}</span>
                          </Link>
                        </SidebarMenuSubItem>
                      );
                    })}

                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ) : null}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <div
          className={[
            "mb-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]",
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

        <div className={["mb-3 flex items-center gap-2", isDesktopCollapsed ? "justify-center" : ""].join(" ")}>
          {!isDesktopCollapsed ? <span className="text-xs text-[var(--muted-foreground)]">{labels.themeLabel}</span> : null}
          <ThemeToggle
            labels={{
              themeLabel: labels.themeLabel,
              themeToLight: labels.themeToLight,
              themeToDark: labels.themeToDark,
            }}
          />
        </div>

        {!isDesktopCollapsed ? <p className="text-xs text-[var(--muted-foreground)]">{labels.signedInAs}</p> : null}
        <DropdownMenu open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              aria-label={labels.signedInAs}
              className={[
                "mt-1 px-2",
                isDesktopCollapsed ? "justify-center" : "gap-2",
                isProfileActive
                  ? "bg-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-fg)]"
                  : "text-[var(--sidebar-link)] hover:bg-[var(--sidebar-link-hover)]",
              ].join(" ")}
            >
              <UserCog size={16} />
              {!isDesktopCollapsed ? (
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium text-[var(--foreground)]">{user.name}</span>
                  <span className="block truncate text-xs text-[var(--muted-foreground)]">{user.email}</span>
                </span>
              ) : null}
              {!isDesktopCollapsed ? (
                <ChevronDown size={16} className={isUserDropdownOpen ? "rotate-180 transition-transform" : "transition-transform"} />
              ) : null}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={isMobile ? 6 : 10}
            className="w-56"
          >
            <DropdownMenuItem asChild>
              <Link
                href={profileHref}
                aria-current={isProfileActive ? "page" : undefined}
                className="w-full"
                onClick={() => {
                  if (isMobile) setIsMobileOpen(false);
                }}
              >
                <UserCog size={14} />
                {labels.nav.profileSettings}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={logoutHref}
                className="w-full"
                onClick={() => {
                  if (isMobile) setIsMobileOpen(false);
                }}
              >
                <LogOut size={14} />
                {labels.logout}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <p
          className={[
            "mt-2 inline-flex rounded-md bg-[var(--role-badge-bg)] px-2 py-1 text-xs font-medium text-[var(--role-badge-fg)]",
            isDesktopCollapsed ? "mx-auto" : "",
          ].join(" ")}
        >
          {user.role}
        </p>
      </SidebarFooter>
    </Sidebar>
    </>
  );
}
