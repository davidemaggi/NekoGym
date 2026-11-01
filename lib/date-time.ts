const DEFAULT_LOCALE = "it-IT";
const DEFAULT_TIME_ZONE = "Europe/Rome";
const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_LOCAL_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

type DateValue = Date | string | number;

type InjectedDateTimeConfig = { locale?: string; timeZone?: string };

/** In the browser, the server's runtime config (written by the root layout) wins over build-time NEXT_PUBLIC_ values. */
function injectedConfig(): InjectedDateTimeConfig | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { __NEKO_DATETIME__?: InjectedDateTimeConfig }).__NEKO_DATETIME__ ?? null;
}

function configuredLocale(): string {
  return (
    injectedConfig()?.locale ||
    process.env.NEXT_PUBLIC_APP_DATETIME_LOCALE?.trim() ||
    process.env.APP_DATETIME_LOCALE?.trim() ||
    DEFAULT_LOCALE
  );
}

function configuredTimeZone(): string {
  return (
    injectedConfig()?.timeZone ||
    process.env.NEXT_PUBLIC_APP_DATETIME_TIMEZONE?.trim() ||
    process.env.APP_DATETIME_TIMEZONE?.trim() ||
    DEFAULT_TIME_ZONE
  );
}

function resolvedTimeZone(): string {
  const candidate = configuredTimeZone();
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date(0));
    return candidate;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

function toDate(value: DateValue): Date {
  return value instanceof Date ? value : new Date(value);
}

function parseTimezoneOffsetMinutes(offsetLabel: string): number | null {
  if (offsetLabel === "GMT" || offsetLabel === "UTC") return 0;
  const match = /^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(offsetLabel);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = Number.parseInt(match[3] ?? "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return sign * (hours * 60 + minutes);
}

function getTimeZoneOffsetMinutes(instantMs: number, timeZone: string): number | null {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(instantMs));
  const tzLabel = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  return parseTimezoneOffsetMinutes(tzLabel);
}

function localDateTimeInZoneToUtcDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timeZone: string
): Date | null {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  for (let i = 0; i < 3; i += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(utcMs, timeZone);
    if (offsetMinutes === null) return null;
    const adjusted = Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - offsetMinutes * 60 * 1000;
    if (adjusted === utcMs) break;
    utcMs = adjusted;
  }
  const candidate = new Date(utcMs);
  const verifier = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = verifier.formatToParts(candidate);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const raw = parts.find((part) => part.type === type)?.value ?? "";
    return Number.parseInt(raw, 10);
  };
  if (
    read("year") !== year ||
    read("month") !== month ||
    read("day") !== day ||
    read("hour") !== hour ||
    read("minute") !== minute ||
    read("second") !== second
  ) {
    return null;
  }
  return candidate;
}

export function getAppDateTimeConfig() {
  return {
    locale: configuredLocale(),
    timeZone: resolvedTimeZone(),
  };
}

/** Calendar date of an instant in the app time zone (weekday: Sunday=0 ... Saturday=6). */
export function getAppDateParts(value: DateValue): { year: number; month: number; day: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolvedTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(toDate(value));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number.parseInt(parts.find((part) => part.type === type)?.value ?? "", 10);
  const year = read("year");
  const month = read("month");
  const day = read("day");
  return { year, month, day, weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay() };
}

/**
 * Instant of a wall-clock time in the app time zone. Day/month overflow is normalized (e.g. day 32).
 * A time skipped by DST (spring forward gap) is moved forward to the first valid hour.
 */
export function appLocalDateTimeToUtc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const normalized = new Date(Date.UTC(year, month - 1, day));
  const y = normalized.getUTCFullYear();
  const m = normalized.getUTCMonth() + 1;
  const d = normalized.getUTCDate();
  const timeZone = resolvedTimeZone();
  for (let shift = 0; shift < 3 && hour + shift < 24; shift += 1) {
    const candidate = localDateTimeInZoneToUtcDate(y, m, d, hour + shift, minute, 0, 0, timeZone);
    if (candidate) return candidate;
  }
  return new Date(Date.UTC(y, m - 1, d, hour, minute));
}

/** Instant of local midnight in the app time zone. Day/month overflow is normalized (e.g. day 32). */
export function appStartOfDayUtc(year: number, month: number, day: number): Date {
  return appLocalDateTimeToUtc(year, month, day, 0, 0);
}

/** `YYYY-MM-DDTHH:mm` of an instant in the app time zone, for <input type="datetime-local"> values. */
export function appDateTimeLocalValue(value: DateValue): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolvedTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(toDate(value));
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}`;
}

/** Wall-clock hour and minute of an instant in the app time zone. */
export function getAppTimeParts(value: DateValue): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolvedTimeZone(),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(toDate(value));
  const read = (type: Intl.DateTimeFormatPartTypes) => Number.parseInt(parts.find((part) => part.type === type)?.value ?? "0", 10);
  return { hour: read("hour"), minute: read("minute") };
}

/** Weekday (Sunday=0) of a `YYYY-MM-DD` calendar date, independent of any time zone. */
export function weekdayOfDateKey(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map((part) => Number.parseInt(part, 10));
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** `YYYY-MM-DD` of an instant in the app time zone (same format as date inputs / closed dates). */
export function appDateKey(value: DateValue): string {
  const { year, month, day } = getAppDateParts(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseDateInputToUtc(value: string): Date | null {
  const match = DATE_INPUT_PATTERN.exec(value.trim());
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  return localDateTimeInZoneToUtcDate(year, month, day, 0, 0, 0, 0, resolvedTimeZone());
}

export function parseDateInputEndOfDayToUtc(value: string): Date | null {
  const match = DATE_INPUT_PATTERN.exec(value.trim());
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  return localDateTimeInZoneToUtcDate(year, month, day, 23, 59, 59, 999, resolvedTimeZone());
}

export function parseDateTimeLocalInputToUtc(value: string): Date | null {
  const match = DATETIME_LOCAL_INPUT_PATTERN.exec(value.trim());
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const hour = Number.parseInt(match[4], 10);
  const minute = Number.parseInt(match[5], 10);
  const second = Number.parseInt(match[6] ?? "0", 10);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    Number.isNaN(second)
  ) {
    return null;
  }
  return localDateTimeInZoneToUtcDate(year, month, day, hour, minute, second, 0, resolvedTimeZone());
}

export function createAppDateTimeFormatter(options: Intl.DateTimeFormatOptions) {
  const { locale, timeZone } = getAppDateTimeConfig();
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone });
  } catch {
    formatter = new Intl.DateTimeFormat(DEFAULT_LOCALE, { ...options, timeZone: DEFAULT_TIME_ZONE });
  }

  return (value: DateValue): string => {
    const date = toDate(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return formatter.format(date);
  };
}

export function formatDateTimeForApp(value: DateValue, options?: Intl.DateTimeFormatOptions): string {
  const format = createAppDateTimeFormatter(
    options ?? {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
  return format(value);
}

/**
 * "2–8 nov" / "30 nov – 6 dic": a span of calendar days, both ends inclusive. Built by hand because
 * Intl's formatRange pads days in some locales ("02–08 nov").
 */
export function formatDayRange(intlLocale: string, start: Date, endInclusive: Date, timeZone: string): string {
  const day = new Intl.DateTimeFormat(intlLocale, { timeZone, day: "numeric" });
  const month = new Intl.DateTimeFormat(intlLocale, { timeZone, month: "short" });
  const startMonth = month.format(start);
  const endMonth = month.format(endInclusive);
  return startMonth === endMonth
    ? `${day.format(start)}–${day.format(endInclusive)} ${endMonth}`
    : `${day.format(start)} ${startMonth} – ${day.format(endInclusive)} ${endMonth}`;
}
