import { requireAuth } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { buildTelegramStartLink } from "@/lib/telegram";

import { ProfileSettingsManager } from "@/app/[locale]/(app)/settings/profile/profile-settings-manager";

export default async function ProfileSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireAuth(locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).profileSettings;

  const activeLinkToken = await prisma.telegramLinkToken.findFirst({
    where: {
      userId: user.id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { token: true },
  });

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      emailVerifiedAt: true,
      pendingEmail: true,
      totpEnabled: true,
      totpSecret: true,
      telegramChatId: true,
      telegramUsername: true,
      notifyByEmail: true,
      notifyByTelegram: true,
      notifyByWebPush: true,
      notificationsRetentionDays: true,
    },
  });

  const pushCount = await prisma.webPushSubscription.count({
    where: { userId: user.id },
  });

  return (
    <ProfileSettingsManager
      locale={locale}
      labels={labels}
      initialIdentity={{
        email: fullUser?.email ?? user.email,
        pendingEmail: fullUser?.pendingEmail ?? null,
        isEmailVerified: Boolean(fullUser?.emailVerifiedAt),
        totpEnabled: fullUser?.totpEnabled ?? false,
        totpSecret: fullUser?.totpSecret ?? null,
        hasWebPushSubscription: pushCount > 0,
        notifyByEmail: fullUser?.notifyByEmail ?? true,
        notifyByTelegram: fullUser?.notifyByTelegram ?? true,
        notifyByWebPush: fullUser?.notifyByWebPush ?? true,
        notificationsRetentionDays: fullUser?.notificationsRetentionDays ?? 15,
      }}
      initialTelegram={{
        chatId: fullUser?.telegramChatId ?? null,
        username: fullUser?.telegramUsername ?? null,
        linkToken: activeLinkToken?.token ?? null,
        deepLink: activeLinkToken?.token ? buildTelegramStartLink(activeLinkToken.token) : null,
      }}
    />
  );
}
