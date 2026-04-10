"use client";

import { type CSSProperties, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock3, Hourglass, Pencil, Plus, UserRound, Users } from "lucide-react";
import { LessonManageDialog } from "@/app/[locale]/(app)/lessons/lesson-manage-dialog";
import { StandaloneLessonCreateDialog } from "@/app/[locale]/(app)/lessons/standalone-lesson-create-dialog";
import { BookingBadgeToggle } from "@/components/bookings/booking-badge-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { hexToRgba } from "@/lib/lesson-type-icons";

type LessonCalendarItem = {
  id: string;
  title: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string;
  maxAttendees: number;
  cancellationWindowHours: number;
  bookedCount: number;
  availableSeats: number;
  isBookedByCurrentUser: boolean;
  isPendingByCurrentUser: boolean;
  isQueuedByCurrentUser: boolean;
  isAccessDenied: boolean;
  canViewWaitlist: boolean;
  queueLength: number;
  pendingApprovalsCount: number;
  canBook: boolean;
  canUnbook: boolean;
  canManageLesson: boolean;
  occupancy: string;
  isCourseLesson: boolean;
  courseName: string;
  lessonTypeName: string | null;
  lessonTypeId: string;
  lessonTypeIcon: string | null;
  lessonTypeColor: string | null;
  trainerId: string;
  trainerName: string | null;
  attendees: Array<{ id: string; name: string; email: string }>;
  pendingApprovals: Array<{ id: string; name: string; email: string }>;
  waitlist: Array<{ id: string; name: string; email: string }>;
};

type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
const WEEKDAY_BY_INDEX: Weekday[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DEFAULT_OPEN_WEEKDAYS: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

type BookingsManagerProps = {
  locale: string;
  labels: {
    title: string;
    description: string;
    calendarTitle: string;
    monthNavigationLabel: string;
    empty: string;
    seatsLabel: string;
    bookedLabel: string;
    youAreBooked: string;
    awaitingConfirmation: string;
    accessDenied: string;
    courseTag: string;
    detailsCta: string;
    detailsTitle: string;
    detailsDescription: string;
    startsAtLabel: string;
    endsAtLabel: string;
    trainerLabel: string;
    closeCta: string;
    prevMonth: string;
    nextMonth: string;
    bookCta: string;
    unbookCta: string;
    processing: string;
    youAreQueued: string;
    queuedLabel: string;
    joinQueueCta: string;
  };
  lessonCreateLabels: {
    standaloneTitle: string;
    standaloneDescription: string;
    trainerLabel: string;
    startsAtLabel: string;
    standaloneDuration: string;
    standaloneMaxAttendees: string;
    standaloneCancellationWindow: string;
    standaloneLessonType: string;
    lessonTitleLabel: string;
    lessonDescriptionLabel: string;
    createStandaloneCta: string;
    updateStandaloneCta: string;
    updateTrainerCta: string;
    attendeesLabel: string;
    noAttendees: string;
    attendeeSelectLabel: string;
    addAttendeeCta: string;
    removeAttendeeCta: string;
    pendingApprovalsLabel: string;
    noPendingApprovals: string;
    confirmPendingCta: string;
    confirmPendingAndGrantAccessCta: string;
    rejectPendingCta: string;
    waitlistLabel: string;
    noWaitlist: string;
    confirmWaitlistCta: string;
    removeWaitlistCta: string;
    manageTitle: string;
    manageDescription: string;
    manageTriggerLabel: string;
    manageTabMain: string;
    manageTabPeople: string;
    processing: string;
    closeCta: string;
  };
  lessons: LessonCalendarItem[];
  month: string;
  previousMonth: string;
  nextMonth: string;
  canCreateStandaloneLesson: boolean;
  canUpdateTrainer: boolean;
  defaultTrainerId?: string;
  trainerCandidates: Array<{ id: string; name: string }>;
  lessonTypeCandidates: Array<{ id: string; name: string }>;
  attendeeCandidates: Array<{ id: string; name: string; email: string }>;
  openWeekdays: Weekday[];
  closedDates: string[];
  isAdmin: boolean;
};

function formatDateTime(value: string, locale: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(value: string, locale: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function parseMonth(value: string): Date {
  const [yRaw, mRaw] = value.split("-");
  const year = Number.parseInt(yRaw ?? "", 10);
  const month = Number.parseInt(mRaw ?? "", 10) - 1;
  if (Number.isNaN(year) || Number.isNaN(month)) return new Date();
  return new Date(year, month, 1);
}

function monthLabel(value: string, locale: string): string {
  const date = parseMonth(value);
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDayLabel(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(value);
}

function localDateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateKeyFromIso(value: string): string {
  return localDateKeyFromDate(new Date(value));
}

function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function defaultStartsAtForDay(day: Date): string {
  const value = new Date(day);
  const now = new Date();
  const isToday = localDateKeyFromDate(value) === localDateKeyFromDate(now);

  if (isToday) {
    value.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    value.setHours(8, 0, 0, 0);
  }

  return toDateTimeLocalValue(value);
}

function toDateTimeLocalFromIso(value: string): string {
  return toDateTimeLocalValue(new Date(value));
}

function lessonCardStyle(lesson: LessonCalendarItem, isSelected: boolean): CSSProperties | undefined {
  if (!lesson.lessonTypeColor) return undefined;
  return {
    backgroundColor: hexToRgba(lesson.lessonTypeColor, isSelected ? 0.24 : 0.16),
    border: `1px solid ${hexToRgba(lesson.lessonTypeColor, isSelected ? 0.9 : 0.55)}`,
  };
}

export function BookingsManager({
  locale,
  labels,
  lessonCreateLabels,
  lessons,
  month,
  previousMonth,
  nextMonth,
  canCreateStandaloneLesson,
  canUpdateTrainer,
  defaultTrainerId,
  trainerCandidates,
  lessonTypeCandidates,
  attendeeCandidates,
  openWeekdays,
  closedDates,
  isAdmin,
}: BookingsManagerProps) {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [manageLessonId, setManageLessonId] = useState<string | null>(null);

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const manageLesson = lessons.find((lesson) => lesson.id === manageLessonId) ?? null;

  const monthDate = parseMonth(month);
  const firstGridDate = useMemo(() => {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const dayOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - dayOffset);
    return start;
  }, [monthDate]);

  const calendarDays = useMemo(() => {
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstGridDate);
      date.setDate(firstGridDate.getDate() + index);
      const key = localDateKeyFromDate(date);
      const items = lessons
        .filter((lesson) => localDateKeyFromIso(lesson.startsAt) === key)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      return {
        key,
        date,
        items,
        isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      };
    });
  }, [firstGridDate, lessons, monthDate]);

  const todayKey = localDateKeyFromDate(new Date());
  const mobileDays = calendarDays.filter((day) => day.isCurrentMonth && day.items.length > 0);
  const openWeekdaySet = useMemo(
    () => new Set<Weekday>(openWeekdays.length > 0 ? openWeekdays : DEFAULT_OPEN_WEEKDAYS),
    [openWeekdays]
  );
  const closedDateSet = useMemo(() => new Set(closedDates), [closedDates]);

  function isClosedDay(date: Date): boolean {
    const weekday = WEEKDAY_BY_INDEX[date.getDay()];
    const dateKey = localDateKeyFromDate(date);
    return !openWeekdaySet.has(weekday) || closedDateSet.has(dateKey);
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
      </header>

      <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">{labels.calendarTitle}</h3>
            <p className="text-xs text-[var(--muted-foreground)]">{labels.monthNavigationLabel}</p>
          </div>
          <div className="inline-flex items-center gap-2">
            <Link href={`/${locale}/bookings?month=${previousMonth}`} className="text-sm text-[var(--foreground)] hover:underline">
              {labels.prevMonth}
            </Link>
            <span className="rounded-md bg-[var(--muted)] px-2 py-1 text-xs capitalize">{monthLabel(month, locale)}</span>
            <Link href={`/${locale}/bookings?month=${nextMonth}`} className="text-sm text-[var(--foreground)] hover:underline">
              {labels.nextMonth}
            </Link>
          </div>
        </div>

        {lessons.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">{labels.empty}</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {mobileDays.map((day) => (
                <div key={`mobile-${day.key}`} className="rounded-md border border-[var(--surface-border)] p-2">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize">{formatDayLabel(day.date, locale)}</p>
                    {canCreateStandaloneLesson && !isClosedDay(day.date) ? (
                      <StandaloneLessonCreateDialog
                        locale={locale}
                        trainerCandidates={trainerCandidates}
                        lessonTypeCandidates={lessonTypeCandidates}
                        openWeekdays={openWeekdays}
                        closedDates={closedDates}
                        defaultTrainerId={defaultTrainerId}
                        defaultStartsAt={defaultStartsAtForDay(day.date)}
                        labels={{
                          triggerCta: lessonCreateLabels.createStandaloneCta,
                          title: lessonCreateLabels.standaloneTitle,
                          description: lessonCreateLabels.standaloneDescription,
                          trainerLabel: lessonCreateLabels.trainerLabel,
                          standaloneDuration: lessonCreateLabels.standaloneDuration,
                          standaloneMaxAttendees: lessonCreateLabels.standaloneMaxAttendees,
                          standaloneCancellationWindow: lessonCreateLabels.standaloneCancellationWindow,
                          standaloneLessonType: lessonCreateLabels.standaloneLessonType,
                          lessonTitleLabel: lessonCreateLabels.lessonTitleLabel,
                          lessonDescriptionLabel: lessonCreateLabels.lessonDescriptionLabel,
                          startsAtLabel: labels.startsAtLabel,
                          submitCta: lessonCreateLabels.createStandaloneCta,
                          processing: labels.processing,
                          closeCta: labels.closeCta,
                        }}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-transparent p-0 text-zinc-900 hover:bg-black/10 dark:text-zinc-100 dark:hover:bg-white/10"
                            aria-label={`${lessonCreateLabels.createStandaloneCta} - ${formatDayLabel(day.date, locale)}`}
                            title={lessonCreateLabels.createStandaloneCta}
                          >
                            <Plus className="h-5 w-5 shrink-0 stroke-[2.5]" />
                          </button>
                        }
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {day.items.map((lesson) => {
                      const durationMinutes = Math.max(
                        1,
                        Math.round((new Date(lesson.endsAt).getTime() - new Date(lesson.startsAt).getTime()) / 60000)
                      );
                      const timeTooltip = `${labels.startsAtLabel}: ${formatTime(lesson.startsAt, locale)} · ${labels.endsAtLabel}: ${formatTime(lesson.endsAt, locale)}`;
                      const bookedTooltip = isAdmin
                        ? `${labels.bookedLabel}: ${lesson.occupancy} · ${labels.queuedLabel}: ${lesson.queueLength} · ${lessonCreateLabels.pendingApprovalsLabel}: ${lesson.pendingApprovalsCount}`
                        : undefined;

                      return (
                        <div
                          key={`mobile-${lesson.id}`}
                          role="button"
                          tabIndex={0}
                          className={[
                            "w-full cursor-pointer rounded px-2 py-1 text-left text-xs transition hover:brightness-95",
                            selectedLessonId === lesson.id ? "ring-2 ring-offset-1 ring-blue-500" : "",
                            lesson.isAccessDenied ? "opacity-50 saturate-0" : "",
                            !lesson.lessonTypeColor ? "bg-[var(--muted)]" : "",
                          ].join(" ")}
                          style={lessonCardStyle(lesson, selectedLessonId === lesson.id)}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedLessonId(lesson.id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-2">
                            {lesson.lessonTypeIcon ? (
                              <LessonTypeIcon
                                iconPath={lesson.lessonTypeIcon}
                                colorHex={lesson.lessonTypeColor}
                                size={22}
                                title={lesson.lessonTypeName ?? undefined}
                              />
                            ) : null}
                            <div className="min-w-0">
                              <p className="truncate font-semibold leading-5">{lesson.title ?? lesson.courseName}</p>
                            </div>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
                            <span className="inline-flex items-center gap-1" title={timeTooltip}>
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatTime(lesson.startsAt, locale)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Hourglass className="h-3.5 w-3.5" />
                              {durationMinutes} min
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[var(--muted-foreground)]">
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="h-3.5 w-3.5" />
                              {lesson.trainerName ?? "-"}
                            </span>
                            <span title={bookedTooltip} className="inline-flex items-center gap-1">
                              {isAdmin && lesson.pendingApprovalsCount > 0 ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                              ) : (
                                <Users className="h-3.5 w-3.5" />
                              )}
                              {labels.bookedLabel}: {lesson.occupancy}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-end">
                            {lesson.isAccessDenied ? (
                              <Badge variant="neutral" className="text-[10px]">{labels.accessDenied}</Badge>
                            ) : lesson.isQueuedByCurrentUser ? (
                              <Badge variant="warning" className="text-[10px]">{labels.youAreQueued}</Badge>
                            ) : (
                              <BookingBadgeToggle
                                locale={locale}
                                lessonId={lesson.id}
                                isBooked={lesson.isBookedByCurrentUser}
                                isPendingApproval={lesson.isPendingByCurrentUser}
                                canBook={lesson.canBook}
                                canUnbook={lesson.canUnbook}
                                labels={{
                                  bookCta: labels.bookCta,
                                  bookedCta: labels.youAreBooked,
                                  pendingCta: labels.awaitingConfirmation,
                                  processing: labels.processing,
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-[var(--muted-foreground)]">
                {(locale === "it"
                  ? ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]
                  : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                ).map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => (
                <div
                  key={day.key}
                  className={[
                    "min-h-28 rounded-md border p-2",
                    day.isCurrentMonth ? "border-[var(--surface-border)] bg-[var(--surface)]" : "border-[var(--surface-border)] bg-[var(--surface)] opacity-70",
                    day.key === todayKey ? "ring-2 ring-blue-500" : "",
                  ].join(" ")}
                >
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold">{day.date.getDate()}</p>
                    {canCreateStandaloneLesson && day.isCurrentMonth && !isClosedDay(day.date) ? (
                      <StandaloneLessonCreateDialog
                        locale={locale}
                        trainerCandidates={trainerCandidates}
                        lessonTypeCandidates={lessonTypeCandidates}
                        openWeekdays={openWeekdays}
                        closedDates={closedDates}
                        defaultTrainerId={defaultTrainerId}
                        defaultStartsAt={defaultStartsAtForDay(day.date)}
                        labels={{
                          triggerCta: lessonCreateLabels.createStandaloneCta,
                          title: lessonCreateLabels.standaloneTitle,
                          description: lessonCreateLabels.standaloneDescription,
                          trainerLabel: lessonCreateLabels.trainerLabel,
                          standaloneDuration: lessonCreateLabels.standaloneDuration,
                          standaloneMaxAttendees: lessonCreateLabels.standaloneMaxAttendees,
                          standaloneCancellationWindow: lessonCreateLabels.standaloneCancellationWindow,
                          standaloneLessonType: lessonCreateLabels.standaloneLessonType,
                          lessonTitleLabel: lessonCreateLabels.lessonTitleLabel,
                          lessonDescriptionLabel: lessonCreateLabels.lessonDescriptionLabel,
                          startsAtLabel: labels.startsAtLabel,
                          submitCta: lessonCreateLabels.createStandaloneCta,
                          processing: labels.processing,
                          closeCta: labels.closeCta,
                        }}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-transparent p-0 text-zinc-900 hover:bg-black/10 dark:text-zinc-100 dark:hover:bg-white/10"
                            aria-label={`${lessonCreateLabels.createStandaloneCta} - ${formatDayLabel(day.date, locale)}`}
                            title={lessonCreateLabels.createStandaloneCta}
                          >
                            <Plus className="h-4 w-4 shrink-0 stroke-[2.5]" />
                          </button>
                        }
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {day.items.map((lesson) => {
                      const durationMinutes = Math.max(
                        1,
                        Math.round((new Date(lesson.endsAt).getTime() - new Date(lesson.startsAt).getTime()) / 60000)
                      );
                      const timeTooltip = `${labels.startsAtLabel}: ${formatTime(lesson.startsAt, locale)} · ${labels.endsAtLabel}: ${formatTime(lesson.endsAt, locale)}`;
                      const bookedTooltip = isAdmin
                        ? `${labels.bookedLabel}: ${lesson.occupancy} · ${labels.queuedLabel}: ${lesson.queueLength} · ${lessonCreateLabels.pendingApprovalsLabel}: ${lesson.pendingApprovalsCount}`
                        : undefined;

                      return (
                        <div
                          key={lesson.id}
                          role="button"
                          tabIndex={0}
                          className={[
                            "w-full cursor-pointer rounded px-2 py-1 text-left text-[11px] transition hover:brightness-95",
                            selectedLessonId === lesson.id ? "ring-2 ring-offset-1 ring-blue-500" : "",
                            lesson.isAccessDenied ? "opacity-50 saturate-0" : "",
                            !lesson.lessonTypeColor ? "bg-[var(--muted)]" : "",
                          ].join(" ")}
                          style={lessonCardStyle(lesson, selectedLessonId === lesson.id)}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedLessonId(lesson.id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-2">
                            {lesson.lessonTypeIcon ? (
                              <LessonTypeIcon
                                iconPath={lesson.lessonTypeIcon}
                                colorHex={lesson.lessonTypeColor}
                                size={20}
                                title={lesson.lessonTypeName ?? undefined}
                              />
                            ) : null}
                            <div className="min-w-0">
                              <p className="truncate font-semibold leading-5">{lesson.title ?? lesson.courseName}</p>
                            </div>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
                            <span className="inline-flex items-center gap-1" title={timeTooltip}>
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatTime(lesson.startsAt, locale)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Hourglass className="h-3.5 w-3.5" />
                              {durationMinutes} min
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[var(--muted-foreground)]">
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="h-3.5 w-3.5" />
                              {lesson.trainerName ?? "-"}
                            </span>
                            <span title={bookedTooltip} className="inline-flex items-center gap-1">
                              {isAdmin && lesson.pendingApprovalsCount > 0 ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                              ) : (
                                <Users className="h-3.5 w-3.5" />
                              )}
                              {labels.bookedLabel}: {lesson.occupancy}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-end">
                            {lesson.isAccessDenied ? (
                              <Badge variant="neutral" className="text-[10px]">{labels.accessDenied}</Badge>
                            ) : lesson.isQueuedByCurrentUser ? (
                              <Badge variant="warning" className="text-[10px]">{labels.youAreQueued}</Badge>
                            ) : (
                              <BookingBadgeToggle
                                locale={locale}
                                lessonId={lesson.id}
                                isBooked={lesson.isBookedByCurrentUser}
                                isPendingApproval={lesson.isPendingByCurrentUser}
                                canBook={lesson.canBook}
                                canUnbook={lesson.canUnbook}
                                labels={{
                                  bookCta: labels.bookCta,
                                  bookedCta: labels.youAreBooked,
                                  pendingCta: labels.awaitingConfirmation,
                                  processing: labels.processing,
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              </div>
            </div>

            <Dialog open={Boolean(selectedLesson)} onOpenChange={(open) => !open && setSelectedLessonId(null)}>
              <DialogContent>
                {selectedLesson ? (
                  <>
                    <DialogHeader>
                      <div className="flex items-start gap-3">
                        {selectedLesson.lessonTypeIcon ? (
                          <span
                            className="inline-flex h-16 w-16 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: selectedLesson.lessonTypeColor
                                ? hexToRgba(selectedLesson.lessonTypeColor, 0.18)
                                : undefined,
                              border: selectedLesson.lessonTypeColor
                                ? `1px solid ${hexToRgba(selectedLesson.lessonTypeColor, 0.5)}`
                                : undefined,
                            }}
                          >
                            <LessonTypeIcon
                              iconPath={selectedLesson.lessonTypeIcon}
                              colorHex={selectedLesson.lessonTypeColor}
                              size={44}
                              title={selectedLesson.lessonTypeName ?? undefined}
                            />
                          </span>
                        ) : null}
                        <div className="space-y-1">
                          <DialogTitle className="text-xl">{selectedLesson.title ?? selectedLesson.courseName}</DialogTitle>
                          <DialogDescription>{labels.detailsDescription}</DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <div
                      className="space-y-2 rounded-md p-2 text-sm"
                      style={
                        selectedLesson.lessonTypeColor
                          ? {
                              backgroundColor: hexToRgba(selectedLesson.lessonTypeColor, 0.14),
                              border: `1px solid ${hexToRgba(selectedLesson.lessonTypeColor, 0.45)}`,
                            }
                          : undefined
                      }
                    >
                      {selectedLesson.description ? (
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {lessonCreateLabels.lessonDescriptionLabel}: {selectedLesson.description}
                        </p>
                      ) : null}
                      <p>{labels.startsAtLabel}: {formatDateTime(selectedLesson.startsAt, locale)}</p>
                      <p>{labels.endsAtLabel}: {formatDateTime(selectedLesson.endsAt, locale)}</p>
                      <p>{labels.trainerLabel}: {selectedLesson.trainerName ?? "-"}</p>
                      <p>{labels.bookedLabel}: {selectedLesson.occupancy}</p>
                      {selectedLesson.canViewWaitlist ? <p>{labels.queuedLabel}: {selectedLesson.queueLength}</p> : null}
                      {selectedLesson.isCourseLesson ? (
                        <Badge variant="info">
                          {labels.courseTag}
                        </Badge>
                      ) : null}
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        {selectedLesson.lessonTypeIcon ? (
                          <LessonTypeIcon
                            iconPath={selectedLesson.lessonTypeIcon}
                            colorHex={selectedLesson.lessonTypeColor}
                            size={16}
                            title={selectedLesson.lessonTypeName ?? undefined}
                          />
                        ) : null}
                        <span>{selectedLesson.lessonTypeName ?? "-"}</span>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="secondary" onClick={() => setSelectedLessonId(null)}>
                        {labels.closeCta}
                      </Button>
                      {selectedLesson.canManageLesson ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-1"
                          aria-label={lessonCreateLabels.manageTriggerLabel}
                          title={lessonCreateLabels.manageTriggerLabel}
                          onClick={() => {
                            setManageLessonId(selectedLesson.id);
                            setSelectedLessonId(null);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span>{lessonCreateLabels.manageTriggerLabel}</span>
                        </Button>
                      ) : null}
                      {selectedLesson.isAccessDenied ? (
                        <Badge variant="neutral" className="inline-flex items-center gap-1 px-3 py-2 text-xs">
                          {labels.accessDenied}
                        </Badge>
                      ) : selectedLesson.isQueuedByCurrentUser ? (
                        <Badge variant="warning" className="inline-flex items-center gap-1 px-3 py-2 text-xs">
                          <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
                          {labels.youAreQueued}
                        </Badge>
                      ) : (
                        <BookingBadgeToggle
                          locale={locale}
                          lessonId={selectedLesson.id}
                          isBooked={selectedLesson.isBookedByCurrentUser}
                          isPendingApproval={selectedLesson.isPendingByCurrentUser}
                          canBook={selectedLesson.canBook}
                          canUnbook={selectedLesson.canUnbook}
                          labels={{
                            bookCta: labels.bookCta,
                            bookedCta: labels.youAreBooked,
                            pendingCta: labels.awaitingConfirmation,
                            processing: labels.processing,
                          }}
                        />
                      )}
                    </DialogFooter>
                  </>
                ) : null}
              </DialogContent>
            </Dialog>

            {manageLesson ? (
              <LessonManageDialog
                open
                showDefaultTrigger={false}
                onOpenChangeAction={(nextOpen) => {
                  if (!nextOpen) setManageLessonId(null);
                }}
                locale={locale}
                lesson={{
                  id: manageLesson.id,
                  canEditMain: !manageLesson.isCourseLesson,
                  title: manageLesson.title ?? "",
                  description: manageLesson.description ?? "",
                  startsAt: toDateTimeLocalFromIso(manageLesson.startsAt),
                  durationMinutes: Math.max(
                    1,
                    Math.round((new Date(manageLesson.endsAt).getTime() - new Date(manageLesson.startsAt).getTime()) / 60000)
                  ),
                  maxAttendees: manageLesson.maxAttendees,
                  cancellationWindowHours: manageLesson.cancellationWindowHours,
                  trainerId: manageLesson.trainerId,
                  lessonTypeId: manageLesson.lessonTypeId,
                  canManageTrainer: canUpdateTrainer,
                  attendees: manageLesson.attendees,
                  pendingApprovals: manageLesson.pendingApprovals,
                  waitlist: manageLesson.waitlist,
                }}
                trainerCandidates={trainerCandidates}
                lessonTypeCandidates={lessonTypeCandidates}
                attendeeCandidates={attendeeCandidates}
                openWeekdays={openWeekdays}
                closedDates={closedDates}
                labels={{
                  title: lessonCreateLabels.manageTitle,
                  description: lessonCreateLabels.manageDescription,
                  tabMain: lessonCreateLabels.manageTabMain,
                  tabPeople: lessonCreateLabels.manageTabPeople,
                  startsAtLabel: lessonCreateLabels.startsAtLabel,
                  trainerLabel: lessonCreateLabels.trainerLabel,
                  standaloneDuration: lessonCreateLabels.standaloneDuration,
                  standaloneMaxAttendees: lessonCreateLabels.standaloneMaxAttendees,
                  standaloneCancellationWindow: lessonCreateLabels.standaloneCancellationWindow,
                  standaloneLessonType: lessonCreateLabels.standaloneLessonType,
                  lessonTitleLabel: lessonCreateLabels.lessonTitleLabel,
                  lessonDescriptionLabel: lessonCreateLabels.lessonDescriptionLabel,
                  updateStandaloneCta: lessonCreateLabels.updateStandaloneCta,
                  updateTrainerCta: lessonCreateLabels.updateTrainerCta,
                  attendeesLabel: lessonCreateLabels.attendeesLabel,
                  noAttendees: lessonCreateLabels.noAttendees,
                  attendeeSelectLabel: lessonCreateLabels.attendeeSelectLabel,
                  addAttendeeCta: lessonCreateLabels.addAttendeeCta,
                  removeAttendeeCta: lessonCreateLabels.removeAttendeeCta,
                  pendingApprovalsLabel: lessonCreateLabels.pendingApprovalsLabel,
                  noPendingApprovals: lessonCreateLabels.noPendingApprovals,
                  confirmPendingCta: lessonCreateLabels.confirmPendingCta,
                  confirmPendingAndGrantAccessCta: lessonCreateLabels.confirmPendingAndGrantAccessCta,
                  rejectPendingCta: lessonCreateLabels.rejectPendingCta,
                  waitlistLabel: lessonCreateLabels.waitlistLabel,
                  noWaitlist: lessonCreateLabels.noWaitlist,
                  confirmWaitlistCta: lessonCreateLabels.confirmWaitlistCta,
                  removeWaitlistCta: lessonCreateLabels.removeWaitlistCta,
                  processing: lessonCreateLabels.processing,
                  closeCta: lessonCreateLabels.closeCta,
                  manageTriggerLabel: lessonCreateLabels.manageTriggerLabel,
                }}
              />
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
