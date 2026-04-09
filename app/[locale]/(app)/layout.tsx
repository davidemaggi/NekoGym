import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, isLocale } from "@/lib/i18n";
import { DEFAULT_SITE_LOGO_SVG } from "@/lib/site-logo";
import { getSiteSettings } from "@/lib/site-settings";

export default async function AppAreaLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    redirect("/it");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const dictionary = getDictionary(locale);
  const siteSettings = await getSiteSettings();
  const siteName = siteSettings?.siteName || dictionary.appName;
  const siteLogoSvg = siteSettings?.siteLogoSvg || DEFAULT_SITE_LOGO_SVG;

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        user={user}
        locale={locale}
        siteName={siteName}
        siteLogoSvg={siteLogoSvg}
        labels={dictionary.sidebar}
      />
      <main className="min-w-0 flex-1 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}

