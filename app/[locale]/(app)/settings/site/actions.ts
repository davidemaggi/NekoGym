"use server";

import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";

import { requireAnyRole } from "@/lib/authorization";
import { reconcileFutureLessonsForSiteSchedule } from "@/lib/lessons";
import { getSmtpEnvConfig, getTelegramEnvConfig } from "@/lib/notifications-config";
import { sanitizeSiteLogoSvg } from "@/lib/site-logo";
import {
  WEEKDAY_VALUES,
  getInvalidClosedDateLines,
  parseClosedDatesCsv,
  upsertSiteSettings,
  type SiteSettingsInput,
} from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";

type SaveSettingsResult = {
  ok: boolean;
  message: string;
};

type TestSmtpResult = {
  ok: boolean;
  message: string;
};

type TestTelegramResult = {
  ok: boolean;
  message: string;
};

function getField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getWeekdays(formData: FormData, key: string): SiteSettingsInput["openWeekdays"] {
  const values = formData.getAll(key);
  const normalized = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value): value is SiteSettingsInput["openWeekdays"][number] =>
      WEEKDAY_VALUES.includes(value as SiteSettingsInput["openWeekdays"][number])
    );
  return normalized.length > 0 ? normalized : ["MONDAY"];
}

function messages(locale: string) {
  const isIt = locale === "it";
  return {
    siteNameRequired: isIt ? "Il nome sito e obbligatorio." : "Site name is required.",
    closedDatesInvalid:
      isIt
        ? "Le date di chiusura non sono valide. Usa YYYY-MM-DD e date reali."
        : "Closed dates are invalid. Use YYYY-MM-DD with real calendar dates.",
    saved: isIt ? "Impostazioni salvate." : "Settings saved.",
    smtpHostRequired: isIt ? "SMTP_HOST obbligatoria per il test." : "SMTP_HOST is required for test.",
    smtpPortInvalid: isIt ? "SMTP_PORT non valida." : "SMTP_PORT is invalid.",
    smtpAuthInvalid:
      isIt
        ? "Con SMTP_AUTH_ENABLED=true servono SMTP_USER e SMTP_PASSWORD."
        : "With SMTP_AUTH_ENABLED=true you must set SMTP_USER and SMTP_PASSWORD.",
    smtpFromRequired: isIt ? "SMTP_FROM_EMAIL obbligatoria per il test." : "SMTP_FROM_EMAIL is required for test.",
    smtpTestSent: isIt ? "Email di test inviata con successo." : "Test email sent successfully.",
    smtpTestFailed: isIt ? "Invio email di test fallito." : "Failed to send test email.",
    telegramTokenMissing: isIt ? "TELEGRAM_BOT_TOKEN non configurato." : "TELEGRAM_BOT_TOKEN is not configured.",
    telegramChatMissing: isIt ? "Collega Telegram al tuo profilo per testare l'invio." : "Link Telegram to your profile to test delivery.",
    telegramTestSent: isIt ? "Messaggio Telegram di test inviato." : "Telegram test message sent.",
    telegramTestFailed: isIt ? "Invio test Telegram fallito." : "Failed to send Telegram test message.",
    failed: isIt ? "Impossibile salvare le impostazioni." : "Unable to save settings.",
  };
}

function parseSmtpPort(raw: number): number | null {
  const parsed = Number.parseInt(String(raw), 10);
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > 65535) return null;
  return parsed;
}

export async function saveSiteSettingsAction(formData: FormData): Promise<SaveSettingsResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);

    const input: SiteSettingsInput = {
      siteName: getField(formData, "siteName"),
      siteLogoSvg: sanitizeSiteLogoSvg(getField(formData, "siteLogoSvg")),
      weeklyResetWeekday: WEEKDAY_VALUES.includes(getField(formData, "weeklyResetWeekday") as SiteSettingsInput["weeklyResetWeekday"])
        ? (getField(formData, "weeklyResetWeekday") as SiteSettingsInput["weeklyResetWeekday"])
        : "MONDAY",
      openWeekdays: getWeekdays(formData, "openWeekdays"),
      closedDates: parseClosedDatesCsv(getField(formData, "closedDates")),
      contactAddress: getField(formData, "contactAddress"),
      contactEmail: getField(formData, "contactEmail"),
      contactPhone: getField(formData, "contactPhone"),
    };

    if (!input.siteName) {
      throw new Error(t.siteNameRequired);
    }

    if (getInvalidClosedDateLines(getField(formData, "closedDates")).length > 0) {
      throw new Error(t.closedDatesInvalid);
    }

    await upsertSiteSettings(input);
    await prisma.$transaction(async (tx) => {
      await reconcileFutureLessonsForSiteSchedule(tx);
    });

    revalidatePath(`/${locale}/settings/site`);
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/bookings`);
    revalidatePath(`/${locale}/lessons`);

    return { ok: true, message: t.saved };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.failed,
    };
  }
}

export async function sendTestSiteEmailAction(formData: FormData): Promise<TestSmtpResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const user = await requireAnyRole(["ADMIN"], locale);

    const smtp = getSmtpEnvConfig();

    if (!smtp.host) {
      throw new Error(t.smtpHostRequired);
    }

    const smtpPort = parseSmtpPort(smtp.port);
    if (!smtpPort) {
      throw new Error(t.smtpPortInvalid);
    }

    if (smtp.authEnabled && (!smtp.user || !smtp.hasPassword)) {
      throw new Error(t.smtpAuthInvalid);
    }

    if (!smtp.fromEmail) {
      throw new Error(t.smtpFromRequired);
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtpPort,
      secure: smtpPort === 465,
      ...(smtp.authEnabled
        ? {
            auth: {
              user: smtp.user,
              pass: process.env.SMTP_PASSWORD,
            },
          }
        : {}),
    });

    await transporter.sendMail({
      from: smtp.fromEmail,
      to: user.email,
      subject: `[NekoGym] SMTP test ${new Date().toISOString()}`,
      text:
        locale === "it"
          ? "Questa e una email di test SMTP inviata da NekoGym."
          : "This is a SMTP test email sent by NekoGym.",
    });

    return { ok: true, message: t.smtpTestSent };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.smtpTestFailed,
    };
  }
}

export async function sendTestSiteTelegramAction(formData: FormData): Promise<TestTelegramResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const user = await requireAnyRole(["ADMIN"], locale);
    const telegram = getTelegramEnvConfig();
    if (!telegram.hasBotToken) {
      throw new Error(t.telegramTokenMissing);
    }

    const userWithTelegram = await prisma.user.findUnique({
      where: { id: user.id },
      select: { telegramChatId: true },
    });
    if (!userWithTelegram?.telegramChatId) {
      throw new Error(t.telegramChatMissing);
    }

    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: userWithTelegram.telegramChatId,
        text:
          locale === "it"
            ? `Test Telegram NekoGym (${new Date().toLocaleString("it-IT")})`
            : `NekoGym Telegram test (${new Date().toLocaleString("en-US")})`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API HTTP ${response.status}`);
    }

    return { ok: true, message: t.telegramTestSent };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.telegramTestFailed,
    };
  }
}

