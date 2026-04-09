"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { bookLessonAction, unbookLessonAction } from "@/app/[locale]/(app)/bookings/actions";
import { LessonManageDialog } from "@/app/[locale]/(app)/lessons/lesson-manage-dialog";
import { StandaloneLessonCreateDialog } from "@/app/[locale]/(app)/lessons/standalone-lesson-create-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type LessonCalendarItem = {
  id: string;
  startsAt: string;
  endsAt: string;
  maxAttendees: number;
  cancellationWindowHours: number;
  bookedCount: number;
  availableSeats: number;
  isBookedByCurrentUser: boolean;
  isQueuedByCurrentUser: boolean;
  canViewWaitlist: boolean;
  queueLength: number;
  canBook: boolean;
  canUnbook: boolean;
  canManageLesson: boolean;
  occupancy: string;
  isCourseLesson: boolean;
  courseName: string;
  lessonTypeName: string | null;
  lessonTypeId: string;
  lessonTypeIcon: string | null;
  trainerId: string;
  trainerName: string | null;
  attendees: Array<{ id: string; name: string; email: string }>;
  waitlist: Array<{ id: string; name: string; email: string }>;
};

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
    createStandaloneCta: string;
    updateStandaloneCta: string;
    updateTrainerCta: string;
    attendeesLabel: string;
    noAttendees: string;
    attendeeSelectLabel: string;
    addAttendeeCta: string;
    removeAttendeeCta: string;
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
}: BookingsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
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

  function handleBook(lessonId: string) {
    const formData = new FormData();
    formData.set("lessonId", lessonId);
    formData.set("locale", locale);

    startTransition(async () => {
      const result = await bookLessonAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setSelectedLessonId(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleUnbook(lessonId: string) {
    const formData = new FormData();
    formData.set("lessonId", lessonId);
    formData.set("locale", locale);

    startTransition(async () => {
      const result = await unbookLessonAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setSelectedLessonId(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
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
                    {canCreateStandaloneLesson ? (
                      <StandaloneLessonCreateDialog
                        locale={locale}
                        trainerCandidates={trainerCandidates}
                        lessonTypeCandidates={lessonTypeCandidates}
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
                                  startsAtLabel: labels.startsAtLabel,
                          submitCta: lessonCreateLabels.createStandaloneCta,
                          processing: labels.processing,
                          closeCta: labels.closeCta,
                        }}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--surface-border)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
                            aria-label={`${lessonCreateLabels.createStandaloneCta} - ${formatDayLabel(day.date, locale)}`}
                            title={lessonCreateLabels.createStandaloneCta}
                          >
                            +
                          </button>
                        }
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {day.items.map((lesson) => (
                      <button
                        key={`mobile-${lesson.id}`}
                        type="button"
                        className={[
                          "w-full rounded px-2 py-1 text-left text-xs",
                          lesson.isBookedByCurrentUser
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/50"
                            : "bg-[var(--muted)] hover:brightness-95",
                        ].join(" ")}
                        onClick={() => setSelectedLessonId(lesson.id)}
                      >
                        <p className="font-medium">{formatTime(lesson.startsAt, locale)} · {lesson.courseName}</p>
                        <p className="text-[var(--muted-foreground)]">{labels.bookedLabel}: {lesson.occupancy}</p>
                        {lesson.canViewWaitlist ? (
                          <p className="text-[var(--muted-foreground)]">{labels.queuedLabel}: {lesson.queueLength}</p>
                        ) : null}
                        {lesson.isCourseLesson ? (
                          <Badge variant="info" className="mt-0.5 text-[10px]">
                            {labels.courseTag}
                          </Badge>
                        ) : null}
                        {lesson.isBookedByCurrentUser ? (
                          <Badge variant="success" className="mt-0.5 text-[10px]">{labels.youAreBooked}</Badge>
                        ) : null}
                        {lesson.isQueuedByCurrentUser ? (
                          <Badge variant="warning" className="mt-0.5 text-[10px]">{labels.youAreQueued}</Badge>
                        ) : null}
                      </button>
                    ))}
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
                    {canCreateStandaloneLesson && day.isCurrentMonth ? (
                      <StandaloneLessonCreateDialog
                        locale={locale}
                        trainerCandidates={trainerCandidates}
                        lessonTypeCandidates={lessonTypeCandidates}
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
                          startsAtLabel: labels.startsAtLabel,
                          submitCta: lessonCreateLabels.createStandaloneCta,
                          processing: labels.processing,
                          closeCta: labels.closeCta,
                        }}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[var(--surface-border)] text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
                            aria-label={`${lessonCreateLabels.createStandaloneCta} - ${formatDayLabel(day.date, locale)}`}
                            title={lessonCreateLabels.createStandaloneCta}
                          >
                            +
                          </button>
                        }
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {day.items.map((lesson) => (
                      <button
                        key={lesson.id}
                        type="button"
                        className={[
                          "w-full rounded px-2 py-1 text-left text-[11px]",
                          lesson.isBookedByCurrentUser
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/50"
                            : "bg-[var(--muted)] hover:brightness-95",
                        ].join(" ")}
                        onClick={() => setSelectedLessonId(lesson.id)}
                      >
                        <p className="font-medium">{formatTime(lesson.startsAt, locale)} · {lesson.courseName}</p>
                        <p className="text-[var(--muted-foreground)]">{labels.bookedLabel}: {lesson.occupancy}</p>
                        {lesson.canViewWaitlist ? (
                          <p className="text-[var(--muted-foreground)]">{labels.queuedLabel}: {lesson.queueLength}</p>
                        ) : null}
                        {lesson.isCourseLesson ? (
                          <Badge variant="info" className="mt-0.5 text-[10px]">
                            {labels.courseTag}
                          </Badge>
                        ) : null}
                        {lesson.isBookedByCurrentUser ? (
                          <Badge variant="success" className="mt-0.5 text-[10px]">{labels.youAreBooked}</Badge>
                        ) : null}
                        {lesson.isQueuedByCurrentUser ? (
                          <Badge variant="warning" className="mt-0.5 text-[10px]">{labels.youAreQueued}</Badge>
                        ) : null}
                      </button>
                    ))}
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
                      <DialogTitle>{labels.detailsTitle}</DialogTitle>
                      <DialogDescription>{labels.detailsDescription}</DialogDescription>
                    </DialogHeader>

                    <div
                      className={[
                        "space-y-2 rounded-md p-2 text-sm",
                        selectedLesson.isBookedByCurrentUser
                          ? "border border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30"
                          : "",
                      ].join(" ")}
                    >
                      <p className="font-semibold">{selectedLesson.courseName}</p>
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
                          <Image src={selectedLesson.lessonTypeIcon} alt={selectedLesson.lessonTypeName ?? "lesson type"} width={16} height={16} />
                        ) : null}
                        <span>{selectedLesson.lessonTypeName ?? "-"}</span>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="secondary" onClick={() => setSelectedLessonId(null)}>
                        {labels.closeCta}
                      </Button>
                      {selectedLesson.canManageLesson ? (
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--surface-border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                          aria-label={lessonCreateLabels.manageTriggerLabel}
                          title={lessonCreateLabels.manageTriggerLabel}
                          onClick={() => {
                            setManageLessonId(selectedLesson.id);
                            setSelectedLessonId(null);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                      {selectedLesson.isBookedByCurrentUser ? (
                        <div className="inline-flex items-center gap-2">
                          <Badge variant="success" className="px-3 py-2 text-xs">
                            {labels.youAreBooked}
                          </Badge>
                          <Button
                            variant="outline"
                            onClick={() => handleUnbook(selectedLesson.id)}
                            disabled={!selectedLesson.canUnbook || isPending}
                          >
                            {isPending ? labels.processing : labels.unbookCta}
                          </Button>
                        </div>
                      ) : selectedLesson.isQueuedByCurrentUser ? (
                        <Badge variant="warning" className="px-3 py-2 text-xs">
                          {labels.youAreQueued}
                        </Badge>
                      ) : (
                        <Button onClick={() => handleBook(selectedLesson.id)} disabled={!selectedLesson.canBook || isPending}>
                          {isPending
                            ? labels.processing
                            : selectedLesson.availableSeats > 0
                              ? labels.bookCta
                              : labels.joinQueueCta}
                        </Button>
                      )}
                    </DialogFooter>
                  </>
                ) : null}
              </DialogContent>
            </Dialog>

            {manageLesson ? (
              <LessonManageDialog
                open
                onOpenChange={(nextOpen) => {
                  if (!nextOpen) setManageLessonId(null);
                }}
                locale={locale}
                lesson={{
                  id: manageLesson.id,
                  canEditMain: !manageLesson.isCourseLesson,
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
                  waitlist: manageLesson.waitlist,
                }}
                trainerCandidates={trainerCandidates}
                lessonTypeCandidates={lessonTypeCandidates}
                attendeeCandidates={attendeeCandidates}
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
                  updateStandaloneCta: lessonCreateLabels.updateStandaloneCta,
                  updateTrainerCta: lessonCreateLabels.updateTrainerCta,
                  attendeesLabel: lessonCreateLabels.attendeesLabel,
                  noAttendees: lessonCreateLabels.noAttendees,
                  attendeeSelectLabel: lessonCreateLabels.attendeeSelectLabel,
                  addAttendeeCta: lessonCreateLabels.addAttendeeCta,
                  removeAttendeeCta: lessonCreateLabels.removeAttendeeCta,
                  waitlistLabel: lessonCreateLabels.waitlistLabel,
                  noWaitlist: lessonCreateLabels.noWaitlist,
                  confirmWaitlistCta: lessonCreateLabels.confirmWaitlistCta,
                  removeWaitlistCta: lessonCreateLabels.removeWaitlistCta,
                  processing: lessonCreateLabels.processing,
                  closeCta: lessonCreateLabels.closeCta,
                }}
              />
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}


