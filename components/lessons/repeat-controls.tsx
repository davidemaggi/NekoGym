"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useSiteSchedule } from "@/components/lessons/site-schedule-context";
import { SegmentedTabs } from "@/components/settings/settings-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDaysToKey, isDateKey, MAX_REPEAT_OCCURRENCES, planOccurrences, type Recurrence } from "@/lib/lesson-recurrence";
import { cn } from "@/lib/utils";

type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
const WEEKDAY_NAMES: Weekday[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
// Week rows start on Monday, like the rest of the app.
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

export type RepeatMode = Recurrence["mode"];

type RepeatControlsProps = {
  locale: string;
  /** First day a copy may land on (`YYYY-MM-DD`): the lesson's day when creating, the day after when repeating. */
  firstDay: string;
  /** When creating, the first day itself is the lesson being set up (shown as such in the calendar). */
  firstDayIsLesson?: boolean;
  /** Repeating an existing lesson has no "don't repeat" choice. */
  allowNone?: boolean;
  openWeekdays?: Weekday[];
  closedDates?: string[];
  onModeChange?: (mode: RepeatMode) => void;
  idPrefix: string;
};

function dayOf(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map((part) => Number.parseInt(part, 10));
  return new Date(Date.UTC(year, month - 1, day));
}

const COPY = {
  it: {
    label: "Ripeti",
    none: "Non ripetere",
    daily: "Ogni giorno",
    weekly: "Ogni settimana",
    dates: "Date scelte",
    onDays: "Nei giorni",
    ends: "Fine",
    count: "Per N volte",
    until: "Fino al",
    countLabel: "Quante lezioni",
    untilLabel: "Ultimo giorno",
    pickHint: "Tocca i giorni in cui vuoi la lezione.",
    prevMonth: "Mese precedente",
    nextMonth: "Mese successivo",
    closed: "chiuso",
    lessonDay: "giorno della lezione",
    lessonDayNote: "Il punto segna il giorno della lezione: c'è sempre.",
    preview: (n: number) => (n === 1 ? "Verrà creata 1 lezione" : `Verranno create ${n} lezioni`),
    previewNone: "Nessuna lezione con queste opzioni.",
    skipped: (n: number) => (n === 1 ? "1 giorno di chiusura saltato" : `${n} giorni di chiusura saltati`),
    more: (n: number) => `e altre ${n}`,
    cap: `Massimo ${MAX_REPEAT_OCCURRENCES} lezioni per volta.`,
  },
  en: {
    label: "Repeat",
    none: "Don't repeat",
    daily: "Every day",
    weekly: "Every week",
    dates: "Picked dates",
    onDays: "On",
    ends: "Ends",
    count: "N times",
    until: "Until",
    countLabel: "How many lessons",
    untilLabel: "Last day",
    pickHint: "Tap the days you want the lesson on.",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    closed: "closed",
    lessonDay: "the lesson's day",
    lessonDayNote: "The dot marks the lesson's own day: it is always included.",
    preview: (n: number) => (n === 1 ? "1 lesson will be created" : `${n} lessons will be created`),
    previewNone: "No lessons with these options.",
    skipped: (n: number) => (n === 1 ? "1 closed day skipped" : `${n} closed days skipped`),
    more: (n: number) => `and ${n} more`,
    cap: `At most ${MAX_REPEAT_OCCURRENCES} lessons at a time.`,
  },
} as const;

/**
 * Repeat options posted as `repeat*` fields inside the parent form; the preview runs the same
 * `planOccurrences` the server uses, so the list shown is the list created.
 */
export function RepeatControls({
  locale,
  firstDay,
  firstDayIsLesson = false,
  allowNone = true,
  openWeekdays,
  closedDates,
  onModeChange,
  idPrefix,
}: RepeatControlsProps) {
  const t = locale === "it" ? COPY.it : COPY.en;
  const intlLocale = locale === "it" ? "it-IT" : "en-GB";
  const validFirstDay = isDateKey(firstDay) ? firstDay : null;
  const firstWeekday = validFirstDay ? dayOf(validFirstDay).getUTCDay() : 1;

  const [mode, setMode] = useState<RepeatMode>(allowNone ? "none" : "weekly");
  // Until the user picks weekdays or a month, both follow the start date as it changes.
  const [pickedWeekdays, setPickedWeekdays] = useState<number[] | null>(null);
  const weekdays = pickedWeekdays ?? [firstWeekday];
  const [endKind, setEndKind] = useState<"count" | "until">("count");
  const [count, setCount] = useState(4);
  const [until, setUntil] = useState("");
  const [pickedDates, setPickedDates] = useState<string[]>([]);
  const [pickedMonth, setPickedMonth] = useState<string | null>(null);
  const monthCursor = pickedMonth ?? (validFirstDay ?? new Date().toISOString().slice(0, 10)).slice(0, 7);

  // Explicit props win; otherwise the schedule the app layout provides.
  const schedule = useSiteSchedule();
  const effectiveOpen = openWeekdays ?? schedule?.openWeekdays;
  const effectiveClosed = closedDates ?? schedule?.closedDates;
  const openSet = useMemo(
    () => new Set(effectiveOpen && effectiveOpen.length > 0 ? effectiveOpen : WEEKDAY_NAMES),
    [effectiveOpen]
  );
  const closedSet = useMemo(() => new Set(effectiveClosed ?? []), [effectiveClosed]);
  const isOpen = (dateKey: string) => openSet.has(WEEKDAY_NAMES[dayOf(dateKey).getUTCDay()]) && !closedSet.has(dateKey);

  const recurrence: Recurrence =
    mode === "daily"
      ? { mode, end: endKind === "count" ? { kind: "count", count } : { kind: "until", until } }
      : mode === "weekly"
        ? { mode, weekdays, end: endKind === "count" ? { kind: "count", count } : { kind: "until", until } }
        : mode === "dates"
          ? { mode, dates: firstDayIsLesson && validFirstDay ? [validFirstDay, ...pickedDates] : pickedDates }
          : { mode: "none" };
  const plan = validFirstDay ? planOccurrences(recurrence, validFirstDay, isOpen) : null;

  const shortDay = new Intl.DateTimeFormat(intlLocale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const weekdayShort = new Intl.DateTimeFormat(intlLocale, { weekday: "short", timeZone: "UTC" });
  const monthTitle = new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric", timeZone: "UTC" });

  function changeMode(next: RepeatMode) {
    setMode(next);
    onModeChange?.(next);
  }

  function toggleWeekday(day: number) {
    setPickedWeekdays(weekdays.includes(day) ? weekdays.filter((value) => value !== day) : [...weekdays, day]);
  }

  function togglePicked(dateKey: string) {
    setPickedDates((current) => (current.includes(dateKey) ? current.filter((value) => value !== dateKey) : [...current, dateKey]));
  }

  const modes: Array<readonly [RepeatMode, string]> = [
    ...(allowNone ? [["none", t.none] as const] : []),
    ["daily", t.daily],
    ["weekly", t.weekly],
    ["dates", t.dates],
  ];

  // Month grid for "Date scelte": Monday-first rows, leading blanks, closed days disabled.
  const [cursorYear, cursorMonth] = monthCursor.split("-").map((part) => Number.parseInt(part, 10));
  const monthStart = new Date(Date.UTC(cursorYear, cursorMonth - 1, 1));
  const daysInMonth = new Date(Date.UTC(cursorYear, cursorMonth, 0)).getUTCDate();
  const leading = (monthStart.getUTCDay() + 6) % 7;
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => addDaysToKey(monthStart.toISOString().slice(0, 10), index));
  const shiftMonth = (amount: number) => {
    const next = new Date(Date.UTC(cursorYear, cursorMonth - 1 + amount, 1));
    setPickedMonth(next.toISOString().slice(0, 7));
  };

  return (
    <fieldset className="space-y-4 border-t border-[var(--rule)] pt-4">
      <legend className="sr-only">{t.label}</legend>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold" aria-hidden="true">
          {t.label}
        </p>
        <SegmentedTabs value={mode} onChange={changeMode} options={modes} label={t.label} />
        <input type="hidden" name="repeatMode" value={mode} />
      </div>

      {mode === "weekly" ? (
        <div className="space-y-1.5">
          <p id={`${idPrefix}-weekdays`} className="text-sm font-semibold">
            {t.onDays}
          </p>
          <div role="group" aria-labelledby={`${idPrefix}-weekdays`} className="grid grid-cols-7 gap-1">
            {MONDAY_FIRST.map((day) => {
              const pressed = weekdays.includes(day);
              const closed = !openSet.has(WEEKDAY_NAMES[day]);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggleWeekday(day)}
                  className={cn(
                    "h-11 rounded-lg text-[15px] font-semibold capitalize transition-colors",
                    pressed
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-border)]",
                    closed && !pressed ? "text-[var(--muted-foreground)] line-through decoration-1" : ""
                  )}
                >
                  {weekdayShort.format(new Date(Date.UTC(2024, 0, 7 + day))).slice(0, 3)}
                </button>
              );
            })}
          </div>
          {weekdays.map((day) => (
            <input key={day} type="hidden" name="repeatWeekdays" value={day} />
          ))}
        </div>
      ) : null}

      {mode === "daily" || mode === "weekly" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold" aria-hidden="true">
              {t.ends}
            </p>
            <SegmentedTabs
              value={endKind}
              onChange={setEndKind}
              options={[
                ["count", t.count],
                ["until", t.until],
              ]}
              label={t.ends}
            />
            <input type="hidden" name="repeatEndKind" value={endKind} />
          </div>
          {endKind === "count" ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-count`}>{t.countLabel}</Label>
              <Input
                id={`${idPrefix}-count`}
                name="repeatCount"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_REPEAT_OCCURRENCES}
                value={String(count)}
                onChange={(event) => setCount(Math.max(0, Math.min(MAX_REPEAT_OCCURRENCES, Number.parseInt(event.target.value || "0", 10) || 0)))}
                className="tabular w-28"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-until`}>{t.untilLabel}</Label>
              <Input
                id={`${idPrefix}-until`}
                name="repeatUntil"
                type="date"
                min={validFirstDay ?? undefined}
                value={until}
                onChange={(event) => setUntil(event.target.value)}
                className="tabular sm:max-w-xs"
              />
            </div>
          )}
        </div>
      ) : null}

      {mode === "dates" ? (
        <div className="space-y-2">
          <p className="text-[15px] text-[var(--muted-foreground)]">
            {t.pickHint}
            {firstDayIsLesson ? ` ${t.lessonDayNote}` : ""}
          </p>
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label={t.prevMonth}
              onClick={() => shiftMonth(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-[var(--muted)]"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <p className="text-[15px] font-semibold capitalize" aria-live="polite">
              {monthTitle.format(monthStart)}
            </p>
            <button
              type="button"
              aria-label={t.nextMonth}
              onClick={() => shiftMonth(1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-[var(--muted)]"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {MONDAY_FIRST.map((day) => (
              <span key={day} aria-hidden="true" className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                {weekdayShort.format(new Date(Date.UTC(2024, 0, 7 + day))).slice(0, 3)}
              </span>
            ))}
            {Array.from({ length: leading }, (_, index) => (
              <span key={`blank-${index}`} aria-hidden="true" />
            ))}
            {monthDays.map((dateKey) => {
              const isFirst = firstDayIsLesson && dateKey === validFirstDay;
              const beforeStart = !validFirstDay || dateKey < validFirstDay;
              const closed = !isOpen(dateKey);
              const picked = pickedDates.includes(dateKey) || isFirst;
              const disabled = beforeStart || closed;
              return (
                <button
                  key={dateKey}
                  type="button"
                  aria-pressed={picked}
                  disabled={disabled}
                  // The lesson's own day is fixed (always created): pressed, not toggleable, and says why.
                  aria-disabled={isFirst || undefined}
                  aria-label={`${shortDay.format(dayOf(dateKey))}${closed ? ` · ${t.closed}` : ""}${isFirst ? ` · ${t.lessonDay}` : ""}`}
                  onClick={() => {
                    if (!isFirst) togglePicked(dateKey);
                  }}
                  className={cn(
                    "tabular relative h-11 rounded-lg text-[15px] font-semibold transition-colors",
                    picked ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "hover:bg-[var(--muted)]",
                    isFirst ? "cursor-default" : "",
                    disabled ? "cursor-not-allowed text-[var(--muted-foreground)] opacity-50" : "",
                    closed ? "line-through decoration-1" : ""
                  )}
                >
                  {Number.parseInt(dateKey.slice(8), 10)}
                  {isFirst ? (
                    <span aria-hidden="true" className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--primary-foreground)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
          {pickedDates.map((dateKey) => (
            <input key={dateKey} type="hidden" name="repeatDates" value={dateKey} />
          ))}
          {firstDayIsLesson && validFirstDay ? <input type="hidden" name="repeatDates" value={validFirstDay} /> : null}
        </div>
      ) : null}

      {mode !== "none" && plan ? (
        <div role="status" className="rounded-xl bg-[var(--muted)] px-4 py-3 text-[15px]">
          {plan.dates.length === 0 ? (
            <p className="font-semibold">{t.previewNone}</p>
          ) : (
            <>
              <p className="font-semibold">
                {t.preview(plan.dates.length)}
                {plan.closed.length > 0 ? <span className="font-normal text-[var(--muted-foreground)]"> · {t.skipped(plan.closed.length)}</span> : null}
              </p>
              <p className="tabular mt-1 text-[var(--muted-foreground)]">
                {plan.dates
                  .slice(0, 6)
                  .map((dateKey) => shortDay.format(dayOf(dateKey)))
                  .join(", ")}
                {plan.dates.length > 6 ? ` ${t.more(plan.dates.length - 6)}` : ""}
              </p>
            </>
          )}
          {plan.truncated ? <p className="mt-1 text-sm text-[var(--warning-fg)]">{t.cap}</p> : null}
        </div>
      ) : null}
    </fieldset>
  );
}
