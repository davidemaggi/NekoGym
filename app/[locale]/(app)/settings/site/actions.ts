"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/authorization";
import { reconcileFutureLessonsForSiteSchedule } from "@/lib/lessons";
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
    failed: isIt ? "Impossibile salvare le impostazioni." : "Unable to save settings.",
  };
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
      smtpHost: getField(formData, "smtpHost"),
      smtpPort: getField(formData, "smtpPort"),
      smtpUser: getField(formData, "smtpUser"),
      smtpPassword: getField(formData, "smtpPassword"),
      smtpFromEmail: getField(formData, "smtpFromEmail"),
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

