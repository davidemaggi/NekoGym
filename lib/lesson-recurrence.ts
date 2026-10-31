/**
 * Repeating a standalone lesson: pure date logic shared by the dialog preview (browser) and the
 * server action, so what the staff sees listed is exactly what gets created.
 * Dates are calendar days (`YYYY-MM-DD`) on the gym's calendar; the time of day comes from the lesson.
 */

export type RecurrenceEnd = { kind: "count"; count: number } | { kind: "until"; until: string };

export type Recurrence =
  | { mode: "none" }
  | { mode: "daily"; end: RecurrenceEnd }
  | { mode: "weekly"; weekdays: number[]; end: RecurrenceEnd }
  | { mode: "dates"; dates: string[] };

/** Upper bound of lessons created by one request (protects against typos like 500). */
export const MAX_REPEAT_OCCURRENCES = 60;
/** How far ahead a series may reach. */
export const MAX_REPEAT_DAYS = 366;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function toDay(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map((part) => Number.parseInt(part, 10));
  return new Date(Date.UTC(year, month - 1, day));
}

function toKey(day: Date): string {
  return day.toISOString().slice(0, 10);
}

export function addDaysToKey(dateKey: string, amount: number): string {
  return toKey(new Date(toDay(dateKey).getTime() + amount * 24 * 60 * 60 * 1000));
}

export function isDateKey(value: string): boolean {
  return DATE_KEY.test(value) && !Number.isNaN(toDay(value).getTime()) && toKey(toDay(value)) === value;
}

export type OccurrencePlan = {
  /** Days a lesson will be created on, in order. */
  dates: string[];
  /** Days the pattern hit but the gym is closed (skipped, never created). */
  closed: string[];
  /** True when the series was cut at MAX_REPEAT_OCCURRENCES / MAX_REPEAT_DAYS. */
  truncated: boolean;
};

/**
 * Days for a recurrence starting at `firstDay` (inclusive).
 * - daily: every open day; weekly: open days whose weekday (Sunday=0) is listed.
 * - count: that many lessons are created (closed days do not consume the count).
 * - until: every matching open day up to that date, inclusive.
 * - dates: exactly the picked days on/after `firstDay` (closed ones are reported, not created).
 */
export function planOccurrences(
  recurrence: Recurrence,
  firstDay: string,
  isOpen: (dateKey: string) => boolean = () => true
): OccurrencePlan {
  const dates: string[] = [];
  const closed: string[] = [];
  if (recurrence.mode === "none" || !isDateKey(firstDay)) return { dates, closed, truncated: false };

  const lastAllowed = addDaysToKey(firstDay, MAX_REPEAT_DAYS);

  if (recurrence.mode === "dates") {
    const picked = Array.from(new Set(recurrence.dates.filter(isDateKey)))
      .filter((day) => day >= firstDay && day <= lastAllowed)
      .sort();
    let truncated = false;
    for (const day of picked) {
      if (!isOpen(day)) {
        closed.push(day);
        continue;
      }
      if (dates.length >= MAX_REPEAT_OCCURRENCES) {
        truncated = true;
        break;
      }
      dates.push(day);
    }
    return { dates, closed, truncated };
  }

  const weekdays = recurrence.mode === "weekly" ? new Set(recurrence.weekdays) : null;
  if (weekdays && weekdays.size === 0) return { dates, closed, truncated: false };
  const end = recurrence.end;
  const wanted = end.kind === "count" ? Math.max(0, Math.floor(end.count)) : Number.POSITIVE_INFINITY;
  const until = end.kind === "until" && isDateKey(end.until) ? end.until : null;
  if (end.kind === "until" && !until) return { dates, closed, truncated: false };

  let truncated = false;
  for (let day = firstDay; dates.length < wanted; day = addDaysToKey(day, 1)) {
    if (until && day > until) break;
    if (day > lastAllowed) {
      truncated = true;
      break;
    }
    if (weekdays && !weekdays.has(toDay(day).getUTCDay())) continue;
    if (!isOpen(day)) {
      closed.push(day);
      continue;
    }
    if (dates.length >= MAX_REPEAT_OCCURRENCES) {
      truncated = true;
      break;
    }
    dates.push(day);
  }
  return { dates, closed, truncated };
}

/** Reads the recurrence fields posted by the repeat controls (`repeat*` form fields). */
export function parseRecurrenceFromForm(formData: FormData): Recurrence {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const mode = read("repeatMode");
  const end = (): RecurrenceEnd =>
    read("repeatEndKind") === "until"
      ? { kind: "until", until: read("repeatUntil") }
      : { kind: "count", count: Number.parseInt(read("repeatCount") || "0", 10) || 0 };

  if (mode === "daily") return { mode: "daily", end: end() };
  if (mode === "weekly") {
    const weekdays = formData
      .getAll("repeatWeekdays")
      .map((value) => Number.parseInt(String(value), 10))
      .filter((value) => value >= 0 && value <= 6);
    return { mode: "weekly", weekdays, end: end() };
  }
  if (mode === "dates") {
    return { mode: "dates", dates: formData.getAll("repeatDates").map((value) => String(value).trim()) };
  }
  return { mode: "none" };
}
