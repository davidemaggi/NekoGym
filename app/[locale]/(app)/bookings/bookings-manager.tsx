"use client";

import { type CSSProperties, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Clock3, Hourglass, Plus, UserRound, Users } from "lucide-react";
import { StandaloneLessonCreateDialog } from "@/app/[locale]/(app)/lessons/standalone-lesson-create-dialog";
import { BookingBadgeToggle } from "@/components/bookings/booking-badge-toggle";
import { LessonDetailsDialogTrigger } from "@/components/lessons/lesson-details-dialog-trigger";
import { Badge } from "@/components/ui/badge";
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
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
    confirmUnbookTitle: string;
    confirmUnbookDescription: string;
    confirmUnbookCta: string;
    confirmKeepBookingCta: string;
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
    notifySectionTitle: string;
    notifyMessageLabel: string;
    notifyMessagePlaceholder: string;
    notifySendCta: string;
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

function lessonCardStyle(lesson: LessonCalendarItem, isSelected: boolean): CSSProperties | undefined {
  const borderStyle: CSSProperties["borderStyle"] = lesson.isBookedByCurrentUser ? "solid" : "dashed";
  if (!lesson.lessonTypeColor) return { borderStyle };
  return {
    backgroundColor: hexToRgba(lesson.lessonTypeColor, isSelected ? 0.24 : 0.16),
    borderColor: hexToRgba(lesson.lessonTypeColor, isSelected ? 0.9 : 0.55),
    borderWidth: 1,
    borderStyle,
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

  // Details are rendered through the shared LessonDetailsDialogTrigger component.

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
                        <LessonDetailsDialogTrigger
                          key={`mobile-${lesson.id}`}
                          locale={locale}
                          lesson={{
                            id: lesson.id,
                            title: lesson.title ?? lesson.courseName,
                            description: lesson.description,
                            startsAt: lesson.startsAt,
                            endsAt: lesson.endsAt,
                            trainerName: lesson.trainerName,
                            occupancy: lesson.occupancy,
                            queueLength: lesson.queueLength,
                            canViewWaitlist: lesson.canViewWaitlist,
                            isCourseLesson: lesson.isCourseLesson,
                            lessonTypeName: lesson.lessonTypeName,
                            lessonTypeIcon: lesson.lessonTypeIcon,
                            lessonTypeColor: lesson.lessonTypeColor,
                            canBroadcast: lesson.canManageLesson,
                          }}
                          labels={{
                            detailsTitle: labels.detailsTitle,
                            detailsDescription: labels.detailsDescription,
                            startsAtLabel: labels.startsAtLabel,
                            endsAtLabel: labels.endsAtLabel,
                            trainerLabel: labels.trainerLabel,
                            bookedLabel: labels.bookedLabel,
                            queuedLabel: labels.queuedLabel,
                            closeCta: labels.closeCta,
                            courseTag: labels.courseTag,
                            lessonDescriptionLabel: lessonCreateLabels.lessonDescriptionLabel,
                            notifySectionTitle: lessonCreateLabels.notifySectionTitle,
                            notifyMessagePlaceholder: lessonCreateLabels.notifyMessagePlaceholder,
                            notifySendCta: lessonCreateLabels.notifySendCta,
                          }}
                          manage={lesson.canManageLesson ? {
                            lesson: {
                              id: lesson.id,
                              canEditMain: !lesson.isCourseLesson,
                              title: lesson.title ?? "",
                              description: lesson.description ?? "",
                              startsAt: toDateTimeLocalValue(new Date(lesson.startsAt)),
                              durationMinutes,
                              maxAttendees: lesson.maxAttendees,
                              cancellationWindowHours: lesson.cancellationWindowHours,
                              trainerId: lesson.trainerId,
                              lessonTypeId: lesson.lessonTypeId,
                              canManageTrainer: canUpdateTrainer,
                              attendees: lesson.attendees,
                              pendingApprovals: lesson.pendingApprovals,
                              waitlist: lesson.waitlist,
                            },
                            trainerCandidates,
                            lessonTypeCandidates,
                            attendeeCandidates,
                            canBroadcastToAttendees: lesson.canManageLesson,
                            labels: {
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
                              notifySectionTitle: lessonCreateLabels.notifySectionTitle,
                              notifyMessageLabel: lessonCreateLabels.notifyMessageLabel,
                              notifyMessagePlaceholder: lessonCreateLabels.notifyMessagePlaceholder,
                              notifySendCta: lessonCreateLabels.notifySendCta,
                            },
                          } : undefined}
                          footerSlot={
                            lesson.isAccessDenied ? (
                              <Badge variant="neutral" className="inline-flex items-center gap-1 px-3 py-2 text-xs">{labels.accessDenied}</Badge>
                            ) : lesson.isQueuedByCurrentUser ? (
                              <Badge variant="warning" className="inline-flex items-center gap-1 px-3 py-2 text-xs">
                                <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
                                {labels.youAreQueued}
                              </Badge>
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
                                  confirmUnbookTitle: labels.confirmUnbookTitle,
                                  confirmUnbookDescription: labels.confirmUnbookDescription,
                                  confirmUnbookCta: labels.confirmUnbookCta,
                                  confirmKeepBookingCta: labels.confirmKeepBookingCta,
                                }}
                              />
                            )
                          }
                          trigger={
                            <div
                              className={[
                                "w-full rounded border border-[var(--surface-border)] px-2 py-1 text-left text-xs transition hover:brightness-95",
                                lesson.isAccessDenied ? "opacity-50 saturate-0" : "",
                                !lesson.lessonTypeColor ? "bg-[var(--muted)]" : "",
                              ].join(" ")}
                              style={lessonCardStyle(lesson, false)}
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
                                    <AlertTriangle className="h-3.5 w-3.5 text-[var(--danger-fg)] dark:text-red-400" />
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
                                  <span className="text-[10px] text-[var(--muted-foreground)]">{labels.detailsCta}</span>
                                )}
                              </div>
                            </div>
                          }
                        />
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
                    day.key === todayKey ? "ring-2 ring-[var(--primary)]" : "",
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
                        <LessonDetailsDialogTrigger
                          key={lesson.id}
                          locale={locale}
                          lesson={{
                            id: lesson.id,
                            title: lesson.title ?? lesson.courseName,
                            description: lesson.description,
                            startsAt: lesson.startsAt,
                            endsAt: lesson.endsAt,
                            trainerName: lesson.trainerName,
                            occupancy: lesson.occupancy,
                            queueLength: lesson.queueLength,
                            canViewWaitlist: lesson.canViewWaitlist,
                            isCourseLesson: lesson.isCourseLesson,
                            lessonTypeName: lesson.lessonTypeName,
                            lessonTypeIcon: lesson.lessonTypeIcon,
                            lessonTypeColor: lesson.lessonTypeColor,
                            canBroadcast: lesson.canManageLesson,
                          }}
                          labels={{
                            detailsTitle: labels.detailsTitle,
                            detailsDescription: labels.detailsDescription,
                            startsAtLabel: labels.startsAtLabel,
                            endsAtLabel: labels.endsAtLabel,
                            trainerLabel: labels.trainerLabel,
                            bookedLabel: labels.bookedLabel,
                            queuedLabel: labels.queuedLabel,
                            closeCta: labels.closeCta,
                            courseTag: labels.courseTag,
                            lessonDescriptionLabel: lessonCreateLabels.lessonDescriptionLabel,
                            notifySectionTitle: lessonCreateLabels.notifySectionTitle,
                            notifyMessagePlaceholder: lessonCreateLabels.notifyMessagePlaceholder,
                            notifySendCta: lessonCreateLabels.notifySendCta,
                          }}
                          manage={lesson.canManageLesson ? {
                            lesson: {
                              id: lesson.id,
                              canEditMain: !lesson.isCourseLesson,
                              title: lesson.title ?? "",
                              description: lesson.description ?? "",
                              startsAt: toDateTimeLocalValue(new Date(lesson.startsAt)),
                              durationMinutes,
                              maxAttendees: lesson.maxAttendees,
                              cancellationWindowHours: lesson.cancellationWindowHours,
                              trainerId: lesson.trainerId,
                              lessonTypeId: lesson.lessonTypeId,
                              canManageTrainer: canUpdateTrainer,
                              attendees: lesson.attendees,
                              pendingApprovals: lesson.pendingApprovals,
                              waitlist: lesson.waitlist,
                            },
                            trainerCandidates,
                            lessonTypeCandidates,
                            attendeeCandidates,
                            canBroadcastToAttendees: lesson.canManageLesson,
                            labels: {
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
                              notifySectionTitle: lessonCreateLabels.notifySectionTitle,
                              notifyMessageLabel: lessonCreateLabels.notifyMessageLabel,
                              notifyMessagePlaceholder: lessonCreateLabels.notifyMessagePlaceholder,
                              notifySendCta: lessonCreateLabels.notifySendCta,
                            },
                          } : undefined}
                          footerSlot={
                            lesson.isAccessDenied ? (
                              <Badge variant="neutral" className="inline-flex items-center gap-1 px-3 py-2 text-xs">{labels.accessDenied}</Badge>
                            ) : lesson.isQueuedByCurrentUser ? (
                              <Badge variant="warning" className="inline-flex items-center gap-1 px-3 py-2 text-xs">
                                <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
                                {labels.youAreQueued}
                              </Badge>
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
                                  confirmUnbookTitle: labels.confirmUnbookTitle,
                                  confirmUnbookDescription: labels.confirmUnbookDescription,
                                  confirmUnbookCta: labels.confirmUnbookCta,
                                  confirmKeepBookingCta: labels.confirmKeepBookingCta,
                                }}
                              />
                            )
                          }
                          trigger={
                            <div
                              className={[
                                "w-full rounded border border-[var(--surface-border)] px-2 py-1 text-left text-[11px] transition hover:brightness-95",
                                lesson.isAccessDenied ? "opacity-50 saturate-0" : "",
                                !lesson.lessonTypeColor ? "bg-[var(--muted)]" : "",
                              ].join(" ")}
                              style={lessonCardStyle(lesson, false)}
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
                                    <AlertTriangle className="h-3.5 w-3.5 text-[var(--danger-fg)] dark:text-red-400" />
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
                                  <span className="text-[10px] text-[var(--muted-foreground)]">{labels.detailsCta}</span>
                                )}
                              </div>
                            </div>
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              </div>
            </div>

          </>
        )}
      </div>
    </section>
  );
}
