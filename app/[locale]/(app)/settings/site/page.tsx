import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getSmtpEnvConfig, getTelegramEnvConfig } from "@/lib/notifications-config";
import { DEFAULT_SITE_LOGO_SVG } from "@/lib/site-logo";
import { parseClosedDatesCsv, parseOpenWeekdaysCsv, getSiteSettings } from "@/lib/site-settings";

import { SiteSettingsManager } from "@/app/[locale]/(app)/settings/site/site-settings-manager";

export default async function SiteSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAnyRole(["ADMIN"], locale);

  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).siteSettings;
  const settings = await getSiteSettings();
  const smtp = getSmtpEnvConfig();
  const telegram = getTelegramEnvConfig();

  return (
    <SiteSettingsManager
      locale={locale}
      labels={labels}
      initialValues={{
        siteName: settings?.siteName ?? "NekoGym",
        siteLogoSvg: settings?.siteLogoSvg ?? DEFAULT_SITE_LOGO_SVG,
        weeklyResetWeekday: settings?.weeklyResetWeekday ?? "MONDAY",
        openWeekdays: parseOpenWeekdaysCsv(settings?.openWeekdaysCsv),
        closedDates: parseClosedDatesCsv(settings?.closedDatesCsv).join("\n"),
        contactAddress: settings?.contactAddress ?? "",
        contactEmail: settings?.contactEmail ?? "",
        contactPhone: settings?.contactPhone ?? "",
      }}
      envValues={{
        smtpHost: smtp.host,
        smtpPort: String(smtp.port),
        smtpAuthEnabled: smtp.authEnabled,
        smtpUser: smtp.user,
        smtpPasswordConfigured: smtp.hasPassword,
        smtpFromEmail: smtp.fromEmail,
        telegramBotUsername: telegram.botUsername,
        telegramBotTokenConfigured: telegram.hasBotToken,
      }}
    />
  );
}

