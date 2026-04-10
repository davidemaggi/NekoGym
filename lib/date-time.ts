const DEFAULT_LOCALE = "it-IT";
const DEFAULT_TIME_ZONE = "Europe/Rome";
const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_LOCAL_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

type DateValue = Date | string | number;

function configuredLocale(): string {
  return (
    process.env.NEXT_PUBLIC_APP_DATETIME_LOCALE?.trim() ||
    process.env.APP_DATETIME_LOCALE?.trim() ||
    DEFAULT_LOCALE
  );
}

function configuredTimeZone(): string {
  return (
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
