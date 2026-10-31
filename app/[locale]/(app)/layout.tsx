import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-sidebar";
import { WebPushPromptBanner } from "@/components/pwa/web-push-banner";
import { getAppVersion } from "@/lib/app-version";
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
  const appVersion = getAppVersion();
  const webPushPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() || "";

  return (
    <AppShell
      user={user}
      locale={locale}
      siteName={siteName}
      siteLogoSvg={siteLogoSvg}
      appVersion={appVersion}
      labels={dictionary.sidebar}
    >
      <WebPushPromptBanner publicKey={webPushPublicKey} labels={dictionary.webPushPrompt} />
      {children}
    </AppShell>
  );
}
