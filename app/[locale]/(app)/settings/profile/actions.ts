"use server";

import { requireAuth } from "@/lib/authorization";
import { changePassword, disableTotp, enableTotp, requestEmailChange, startTotpSetup } from "@/lib/auth";
import { formatDateTimeForApp } from "@/lib/date-time";
import { prisma } from "@/lib/prisma";
import {
  TELEGRAM_LINK_TOKEN_TTL_MINUTES,
  buildTelegramStartLink,
  generateTelegramLinkToken,
} from "@/lib/telegram";

type StartTelegramLinkResult = {
  ok: boolean;
  message: string;
  token?: string;
  deepLink?: string | null;
};

type ProfileMutationResult = {
  ok: boolean;
  message: string;
};

type TotpSetupResult = ProfileMutationResult & {
  secret?: string;
  otpauthUri?: string;
};

function getMessages(locale: string) {
  const isIt = locale === "it";
  return {
    generated: isIt ? "Codice Telegram generato." : "Telegram code generated.",
    failed: isIt ? "Impossibile generare il codice Telegram." : "Unable to generate Telegram code.",
    emailChangeSent: isIt ? "Conferma la nuova email dal link ricevuto." : "Confirm the new email from the link you received.",
    emailChangeFailed: isIt ? "Impossibile avviare il cambio email." : "Unable to start email change.",
    passwordChanged: isIt ? "Password aggiornata." : "Password updated.",
    passwordChangeFailed: isIt ? "Impossibile aggiornare la password." : "Unable to update password.",
    webPushTestQueued: isIt ? "Notifica Web Push di test accodata." : "Web Push test notification queued.",
    webPushTestFailed: isIt ? "Impossibile inviare il test Web Push." : "Unable to send Web Push test notification.",
    notificationPrefsSaved: isIt ? "Preferenze notifiche salvate." : "Notification preferences saved.",
    notificationPrefsFailed: isIt ? "Impossibile salvare le preferenze notifiche." : "Unable to save notification preferences.",
    retentionInvalid:
      isIt
        ? "Valore conservazione notifiche non valido."
        : "Invalid notifications retention value.",
  };
}

function getField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function startTelegramLinkAction(formData: FormData): Promise<StartTelegramLinkResult> {
  const locale = typeof formData.get("locale") === "string" ? String(formData.get("locale")).trim() : "it";
  const t = getMessages(locale || "it");

  try {
    const user = await requireAuth(locale || "it");
    const token = generateTelegramLinkToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TELEGRAM_LINK_TOKEN_TTL_MINUTES * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.telegramLinkToken.updateMany({
        where: {
          userId: user.id,
          consumedAt: null,
        },
        data: {
          consumedAt: now,
        },
      });

      await tx.telegramLinkToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });
    });

    return {
      ok: true,
      message: t.generated,
      token,
      deepLink: buildTelegramStartLink(token),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.failed,
    };
  }
}

export async function requestEmailChangeAction(formData: FormData): Promise<ProfileMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = getMessages(locale);

  try {
    const user = await requireAuth(locale);
    const newEmail = getField(formData, "newEmail").toLowerCase();
    if (!newEmail) {
      throw new Error(locale === "it" ? "Nuova email obbligatoria." : "New email is required.");
    }

    await requestEmailChange({ userId: user.id, locale, newEmail });
    return { ok: true, message: t.emailChangeSent };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.emailChangeFailed,
    };
  }
}

export async function changePasswordAction(formData: FormData): Promise<ProfileMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = getMessages(locale);

  try {
    const user = await requireAuth(locale);
    const currentPassword = getField(formData, "currentPassword");
    const newPassword = getField(formData, "newPassword");

    await changePassword({
      userId: user.id,
      locale,
      currentPassword,
      newPassword,
    });

    return { ok: true, message: t.passwordChanged };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.passwordChangeFailed,
    };
  }
}

export async function sendTestWebPushAction(formData: FormData): Promise<ProfileMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = getMessages(locale);

  try {
    const user = await requireAuth(locale);

    await prisma.notificationOutbox.create({
      data: {
        userId: user.id,
        channel: "WEBPUSH",
        subject: locale === "it" ? "Test Web Push" : "Web Push test",
        body:
          locale === "it"
            ? `Questa e una notifica Web Push di test (${formatDateTimeForApp(new Date())}).`
            : `This is a Web Push test notification (${formatDateTimeForApp(new Date())}).`,
      },
    });
    await prisma.localNotification.create({
      data: {
        userId: user.id,
        subject: locale === "it" ? "Test Web Push" : "Web Push test",
        body:
          locale === "it"
            ? `Questa e una notifica Web Push di test (${formatDateTimeForApp(new Date())}).`
            : `This is a Web Push test notification (${formatDateTimeForApp(new Date())}).`,
      },
    });

    return { ok: true, message: t.webPushTestQueued };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.webPushTestFailed,
    };
  }
}

export async function updateNotificationPreferencesAction(formData: FormData): Promise<ProfileMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = getMessages(locale);

  try {
    const user = await requireAuth(locale);
    const notifyByEmail = getField(formData, "notifyByEmail") === "true";
    const notifyByTelegram = getField(formData, "notifyByTelegram") === "true";
    const notifyByWebPush = getField(formData, "notifyByWebPush") === "true";
    const retentionRaw = getField(formData, "notificationsRetentionDays");
    const retentionDays = Number.parseInt(retentionRaw || "15", 10);
    if (Number.isNaN(retentionDays) || retentionDays < 1 || retentionDays > 365) {
      throw new Error(t.retentionInvalid);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        notifyByEmail,
        notifyByTelegram,
        notifyByWebPush,
        notificationsRetentionDays: retentionDays,
      },
    });

    return { ok: true, message: t.notificationPrefsSaved };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.notificationPrefsFailed,
    };
  }
}

export async function startTotpSetupAction(formData: FormData): Promise<TotpSetupResult> {
  const locale = getField(formData, "locale") || "it";

  try {
    const user = await requireAuth(locale);
    const setup = await startTotpSetup({
      userId: user.id,
      accountName: user.email,
    });

    return {
      ok: true,
      message: locale === "it" ? "Configura l'app e conferma con un codice." : "Set up your app and confirm with a code.",
      secret: setup.secret,
      otpauthUri: setup.otpauthUri,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : locale === "it" ? "Impossibile avviare la configurazione 2FA." : "Unable to start 2FA setup.",
    };
  }
}

export async function enableTotpAction(formData: FormData): Promise<ProfileMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const code = getField(formData, "code");

  try {
    const user = await requireAuth(locale);
    await enableTotp({
      userId: user.id,
      code,
      locale,
    });

    return {
      ok: true,
      message: locale === "it" ? "2FA abilitata." : "2FA enabled.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : locale === "it" ? "Impossibile abilitare la 2FA." : "Unable to enable 2FA.",
    };
  }
}

export async function disableTotpAction(formData: FormData): Promise<ProfileMutationResult> {
  const locale = getField(formData, "locale") || "it";

  try {
    const user = await requireAuth(locale);
    await disableTotp(user.id);

    return {
      ok: true,
      message: locale === "it" ? "2FA disabilitata." : "2FA disabled.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : locale === "it" ? "Impossibile disabilitare la 2FA." : "Unable to disable 2FA.",
    };
  }
}
