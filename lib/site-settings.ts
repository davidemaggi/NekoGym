import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeSiteLogoSvg } from "@/lib/site-logo";

export const WEEKDAY_VALUES = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type WeeklyResetWeekday = (typeof WEEKDAY_VALUES)[number];
export const DEFAULT_OPEN_WEEKDAYS: WeeklyResetWeekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function isIsoDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isRealIsoCalendarDate(value: string): boolean {
  if (!isIsoDateString(value)) return false;
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const month = Number.parseInt(monthRaw ?? "", 10);
  const day = Number.parseInt(dayRaw ?? "", 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return false;

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function getInvalidClosedDateLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !isRealIsoCalendarDate(line));
}

export function parseOpenWeekdaysCsv(value: string | null | undefined): WeeklyResetWeekday[] {
  const raw = (value ?? "").trim();
  const candidates = raw ? raw.split(",") : [];
  const normalized = candidates
    .map((day) => day.trim())
    .filter((day): day is WeeklyResetWeekday => WEEKDAY_VALUES.includes(day as WeeklyResetWeekday));

  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique : DEFAULT_OPEN_WEEKDAYS;
}

export function serializeOpenWeekdaysCsv(days: WeeklyResetWeekday[]): string {
  const normalized = days.filter((day): day is WeeklyResetWeekday => WEEKDAY_VALUES.includes(day));
  return Array.from(new Set(normalized)).join(",");
}

export function parseClosedDatesCsv(value: string | null | undefined): string[] {
  const raw = (value ?? "").trim();
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((date) => date.trim())
        .filter((date) => isRealIsoCalendarDate(date))
    )
  );
}

export function serializeClosedDatesCsv(dates: string[]): string {
  const normalized = dates
    .map((date) => date.trim())
    .filter((date) => isRealIsoCalendarDate(date));
  return Array.from(new Set(normalized)).join(",");
}

export type SiteSettingsInput = {
  siteName: string;
  siteLogoSvg: string;
  weeklyResetWeekday: WeeklyResetWeekday;
  openWeekdays: WeeklyResetWeekday[];
  closedDates: string[];
  contactAddress: string;
  contactEmail: string;
  contactPhone: string;
};

export async function getSiteSettings() {
  return prisma.siteSettings.findUnique({ where: { id: 1 } });
}

export async function getSiteSettingsSafe() {
  try {
    return await getSiteSettings();
  } catch (error) {
    // During image/build-time prerender there might be no migrated DB yet.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return null;
    }
    throw error;
  }
}

export async function upsertSiteSettings(input: SiteSettingsInput) {
  const safeLogoSvg = sanitizeSiteLogoSvg(input.siteLogoSvg);
  const safeWeeklyResetWeekday = WEEKDAY_VALUES.includes(input.weeklyResetWeekday)
    ? input.weeklyResetWeekday
    : "MONDAY";
  const safeOpenWeekdaysCsv = serializeOpenWeekdaysCsv(input.openWeekdays);
  const safeClosedDatesCsv = serializeClosedDatesCsv(input.closedDates);

  return prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      siteName: input.siteName,
      siteLogoSvg: safeLogoSvg,
      weeklyResetWeekday: safeWeeklyResetWeekday,
      openWeekdaysCsv: safeOpenWeekdaysCsv,
      closedDatesCsv: safeClosedDatesCsv,
      contactAddress: input.contactAddress || null,
      contactEmail: input.contactEmail || null,
      contactPhone: input.contactPhone || null,
    },
    create: {
      id: 1,
      siteName: input.siteName,
      siteLogoSvg: safeLogoSvg,
      weeklyResetWeekday: safeWeeklyResetWeekday,
      openWeekdaysCsv: safeOpenWeekdaysCsv,
      closedDatesCsv: safeClosedDatesCsv,
      contactAddress: input.contactAddress || null,
      contactEmail: input.contactEmail || null,
      contactPhone: input.contactPhone || null,
    },
  });
}
