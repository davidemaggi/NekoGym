"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { bookLessonAction, unbookLessonAction } from "@/app/[locale]/(app)/bookings/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type LessonCalendarItem = {
  id: string;
  startsAt: string;
  endsAt: string;
  maxAttendees: number;
  bookedCount: number;
  availableSeats: number;
  isBookedByCurrentUser: boolean;
  canBook: boolean;
  canUnbook: boolean;
  occupancy: string;
  isCourseLesson: boolean;
  courseName: string;
  lessonTypeName: string | null;
  lessonTypeIcon: string | null;
  trainerName: string | null;
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
  };
  lessons: LessonCalendarItem[];
  month: string;
  previousMonth: string;
  nextMonth: string;
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

export function BookingsManager({ locale, labels, lessons, month, previousMonth, nextMonth }: BookingsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;

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
      const key = date.toISOString().slice(0, 10);
      const items = lessons
        .filter((lesson) => lesson.startsAt.slice(0, 10) === key)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      return {
        key,
        date,
        items,
        isCurrentMonth: date.getMonth() === monthDate.getMonth(),
      };
    });
  }, [firstGridDate, lessons, monthDate]);

  const todayKey = new Date().toISOString().slice(0, 10);
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
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{labels.description}</p>
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">{labels.calendarTitle}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{labels.monthNavigationLabel}</p>
          </div>
          <div className="inline-flex items-center gap-2">
            <Link href={`/${locale}/bookings?month=${previousMonth}`} className="text-sm text-zinc-700 hover:underline dark:text-zinc-200">
              {labels.prevMonth}
            </Link>
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs capitalize dark:bg-zinc-800">{monthLabel(month, locale)}</span>
            <Link href={`/${locale}/bookings?month=${nextMonth}`} className="text-sm text-zinc-700 hover:underline dark:text-zinc-200">
              {labels.nextMonth}
            </Link>
          </div>
        </div>

        {lessons.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{labels.empty}</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {mobileDays.map((day) => (
                <div key={`mobile-${day.key}`} className="rounded-md border border-zinc-200 p-2 dark:border-zinc-700">
                  <p className="mb-2 text-xs font-semibold capitalize">{formatDayLabel(day.date, locale)}</p>
                  <div className="space-y-1">
                    {day.items.map((lesson) => (
                      <button
                        key={`mobile-${lesson.id}`}
                        type="button"
                        className={[
                          "w-full rounded px-2 py-1 text-left text-xs",
                          lesson.isBookedByCurrentUser
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/50"
                            : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
                        ].join(" ")}
                        onClick={() => setSelectedLessonId(lesson.id)}
                      >
                        <p className="font-medium">{formatTime(lesson.startsAt, locale)} · {lesson.courseName}</p>
                        <p className="text-zinc-500 dark:text-zinc-300">{labels.bookedLabel}: {lesson.occupancy}</p>
                        {lesson.isCourseLesson ? (
                          <p className="mt-0.5 inline-flex rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                            {labels.courseTag}
                          </p>
                        ) : null}
                        {lesson.isBookedByCurrentUser ? (
                          <p className="mt-0.5 font-medium text-emerald-700 dark:text-emerald-300">{labels.youAreBooked}</p>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
                    day.isCurrentMonth ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" : "border-zinc-100 bg-zinc-50/50 opacity-70 dark:border-zinc-900 dark:bg-zinc-900/50",
                    day.key === todayKey ? "ring-2 ring-blue-500" : "",
                  ].join(" ")}
                >
                  <p className="mb-2 text-xs font-semibold">{day.date.getDate()}</p>
                  <div className="space-y-1">
                    {day.items.map((lesson) => (
                      <button
                        key={lesson.id}
                        type="button"
                        className={[
                          "w-full rounded px-2 py-1 text-left text-[11px]",
                          lesson.isBookedByCurrentUser
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/50"
                            : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
                        ].join(" ")}
                        onClick={() => setSelectedLessonId(lesson.id)}
                      >
                        <p className="font-medium">{formatTime(lesson.startsAt, locale)} · {lesson.courseName}</p>
                        <p className="text-zinc-500 dark:text-zinc-300">{labels.bookedLabel}: {lesson.occupancy}</p>
                        {lesson.isCourseLesson ? (
                          <p className="mt-0.5 inline-flex rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                            {labels.courseTag}
                          </p>
                        ) : null}
                        {lesson.isBookedByCurrentUser ? (
                          <p className="mt-0.5 font-medium text-emerald-700 dark:text-emerald-300">{labels.youAreBooked}</p>
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
                      {selectedLesson.isCourseLesson ? (
                        <p className="inline-flex rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                          {labels.courseTag}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
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
                      {selectedLesson.isBookedByCurrentUser ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-zinc-200 px-3 py-2 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                            {labels.youAreBooked}
                          </span>
                          <Button
                            variant="outline"
                            onClick={() => handleUnbook(selectedLesson.id)}
                            disabled={!selectedLesson.canUnbook || isPending}
                          >
                            {isPending ? labels.processing : labels.unbookCta}
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => handleBook(selectedLesson.id)} disabled={!selectedLesson.canBook || isPending}>
                          {isPending ? labels.processing : labels.bookCta}
                        </Button>
                      )}
                    </DialogFooter>
                  </>
                ) : null}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </section>
  );
}


