import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { Pencil } from "lucide-react";

import {
  deleteStandaloneLessonAction,
} from "@/app/[locale]/(app)/lessons/actions";
import { LessonManageDialog } from "@/app/[locale]/(app)/lessons/lesson-manage-dialog";
import { LessonsFlashToast } from "@/app/[locale]/(app)/lessons/lessons-flash-toast";
import { StandaloneLessonCreateDialog } from "@/app/[locale]/(app)/lessons/standalone-lesson-create-dialog";
import { Badge } from "@/components/ui/badge";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function lessonDifferenceReasons(input: {
  isCustomized: boolean;
  startsAt: Date;
  endsAt: Date;
  sourceStartTime: string | null;
  trainerId: string | null;
  course: { id: string; trainerId: string | null; durationMinutes: number } | null;
}): Array<"trainer" | "time"> {
  if (!input.course?.id) return [];

  const reasons = new Set<"trainer" | "time">();
  if (input.isCustomized) {
    reasons.add("trainer");
    reasons.add("time");
  }

  if (input.trainerId !== input.course.trainerId) {
    reasons.add("trainer");
  }

  const actualDuration = Math.round((input.endsAt.getTime() - input.startsAt.getTime()) / 60000);
  if (actualDuration !== input.course.durationMinutes) {
    reasons.add("time");
  }

  const hh = String(input.startsAt.getHours()).padStart(2, "0");
  const mm = String(input.startsAt.getMinutes()).padStart(2, "0");
  const localStartTime = `${hh}:${mm}`;
  if (input.sourceStartTime && input.sourceStartTime !== localStartTime) {
    reasons.add("time");
  }

  return Array.from(reasons);
}

export default async function LessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ week?: string; flash?: string; flashType?: "success" | "error" }>;
}) {
  const { locale } = await params;
  const { week, flash, flashType } = await searchParams;
  const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).lessonsPage;

  const trainerCandidates =
    currentUser.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "TRAINER"] } },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : [{ id: currentUser.id, name: currentUser.name, email: currentUser.email }];

  const lessonTypeCandidates = await prisma.lessonType.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const attendeeCandidates = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const weekOffset = Number.parseInt(week ?? "0", 10);
  const normalizedOffset = Number.isNaN(weekOffset) ? 0 : weekOffset;

  const weekStart = startOfWeek(new Date());
  weekStart.setDate(weekStart.getDate() + normalizedOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const lessons = await prisma.lesson.findMany({
    where: {
      startsAt: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    include: {
      course: { select: { id: true, name: true, trainerId: true, durationMinutes: true } },
      trainer: { select: { id: true, name: true } },
      bookings: {
        include: {
          trainee: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      waitlistEntries: {
        include: {
          trainee: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { bookings: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const grouped = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const key = dateKey(lesson.startsAt);
    const list = grouped.get(key) ?? [];
    list.push(lesson);
    grouped.set(key, list);
  }

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = dateKey(date);
    return {
      key,
      date,
      lessons: grouped.get(key) ?? [],
    };
  });

  const daysWithLessons = weekDays.filter((day) => day.lessons.length > 0);

  const dateFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
  const shortDateFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-GB", {
    day: "numeric",
    month: "short",
  });
  const timeFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const weekRangeEnd = new Date(weekEnd);
  weekRangeEnd.setDate(weekRangeEnd.getDate() - 1);
  const weekRangeLabel = `${shortDateFmt.format(weekStart)} - ${shortDateFmt.format(weekRangeEnd)}`;
  const now = new Date();

  return (
    <section className="space-y-4">
      <LessonsFlashToast message={flash ?? null} type={flashType ?? null} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
        </div>

        <div className="inline-flex items-center gap-2 text-sm">
          <a className="text-[var(--foreground)] hover:underline" href={`/${locale}/lessons?week=${normalizedOffset - 1}`}>
            {labels.prevWeek}
          </a>
          <span className="rounded-md bg-[var(--muted)] px-2 py-1 text-xs">{labels.weekLabel.replace("{n}", String(normalizedOffset))}</span>
          <span className="rounded-md border border-[var(--surface-border)] px-2 py-1 text-xs">{weekRangeLabel}</span>
          <a className="text-[var(--foreground)] hover:underline" href={`/${locale}/lessons?week=${normalizedOffset + 1}`}>
            {labels.nextWeek}
          </a>
        </div>
      </header>

      <div className="space-y-3">
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{labels.standaloneTitle}</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{labels.standaloneDescription}</p>
            </div>
            <StandaloneLessonCreateDialog
              locale={locale}
              trainerCandidates={trainerCandidates}
              lessonTypeCandidates={lessonTypeCandidates}
              defaultTrainerId={currentUser.role === "TRAINER" ? currentUser.id : undefined}
              labels={{
                triggerCta: labels.createStandaloneCta,
                title: labels.standaloneTitle,
                description: labels.standaloneDescription,
                trainerLabel: labels.trainerLabel,
                standaloneDuration: labels.standaloneDuration,
                standaloneMaxAttendees: labels.standaloneMaxAttendees,
                standaloneCancellationWindow: labels.standaloneCancellationWindow,
                standaloneLessonType: labels.standaloneLessonType,
                startsAtLabel: labels.startsAtLabel,
                submitCta: labels.createStandaloneCta,
                processing: labels.processing,
                closeCta: labels.closeCta,
              }}
            />
          </div>
        </div>

        {daysWithLessons.length === 0 ? (
          <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted-foreground)]">
            {labels.emptyDay}
          </div>
        ) : null}

        {daysWithLessons.map((day) => (
          <div key={day.key} className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
            <h3 className="text-sm font-semibold capitalize">{dateFmt.format(day.date)}</h3>

            <div className="mt-2 space-y-2">
              {day.lessons.map((lesson) => (
                (() => {
                  const isPastOrNow = lesson.startsAt <= now;
                  return (
                <div
                  key={lesson.id}
                  className={[
                    "rounded-md border p-2 text-sm",
                    lessonDifferenceReasons({
                      isCustomized: lesson.isCustomized,
                      startsAt: lesson.startsAt,
                      endsAt: lesson.endsAt,
                      sourceStartTime: lesson.sourceStartTime,
                      trainerId: lesson.trainerId,
                      course: lesson.course,
                    }).length > 0
                      ? "border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/20"
                      : "border-[var(--surface-border)]",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{lesson.course?.name ?? "-"}</p>
                    {lesson.course?.id ? (
                      <Badge variant="info" className="text-[10px]">
                        {labels.courseTag}
                      </Badge>
                    ) : null}
                    {(() => {
                      const reasons = lessonDifferenceReasons({
                        isCustomized: lesson.isCustomized,
                        startsAt: lesson.startsAt,
                        endsAt: lesson.endsAt,
                        sourceStartTime: lesson.sourceStartTime,
                        trainerId: lesson.trainerId,
                        course: lesson.course,
                      });
                      if (reasons.length === 0) return null;

                      return (
                        <div className="inline-flex items-center gap-1">
                          <Badge variant="warning" className="text-[10px]">
                            {labels.modifiedTag}
                          </Badge>
                          <span className="text-[10px] text-amber-700 dark:text-amber-300">
                            {labels.modifiedReasonsLabel}: {reasons
                              .map((reason) => (reason === "trainer" ? labels.modifiedReasonTrainer : labels.modifiedReasonTime))
                              .join(", ")}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {timeFmt.format(lesson.startsAt)} - {timeFmt.format(lesson.endsAt)} · {lesson.status}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {labels.trainerLabel}: {lesson.trainer?.name ?? "-"} · {labels.bookedLabel}: {lesson._count.bookings}/{lesson.maxAttendees}
                  </p>
                  <div className="mt-2 inline-flex gap-2">
                    <LessonManageDialog
                      locale={locale}
                      lesson={{
                        id: lesson.id,
                        canEditMain: !lesson.course?.id && !isPastOrNow,
                        startsAt: toDateTimeLocalValue(lesson.startsAt),
                        durationMinutes: Math.max(1, Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60000)),
                        maxAttendees: lesson.maxAttendees,
                        cancellationWindowHours: lesson.cancellationWindowHours,
                        trainerId: lesson.trainer?.id ?? "",
                        lessonTypeId: lesson.lessonTypeId ?? "",
                        canManageTrainer: currentUser.role === "ADMIN" && !isPastOrNow,
                        attendees: lesson.bookings.map((booking) => ({
                          id: booking.trainee.id,
                          name: booking.trainee.name,
                          email: booking.trainee.email,
                        })),
                        waitlist: lesson.waitlistEntries.map((entry) => ({
                          id: entry.trainee.id,
                          name: entry.trainee.name,
                          email: entry.trainee.email,
                        })),
                      }}
                      trainerCandidates={trainerCandidates}
                      lessonTypeCandidates={lessonTypeCandidates}
                      attendeeCandidates={attendeeCandidates}
                      labels={{
                        title: labels.manageTitle,
                        description: labels.manageDescription,
                        tabMain: labels.manageTabMain,
                        tabPeople: labels.manageTabPeople,
                        startsAtLabel: labels.startsAtLabel,
                        trainerLabel: labels.trainerLabel,
                        standaloneDuration: labels.standaloneDuration,
                        standaloneMaxAttendees: labels.standaloneMaxAttendees,
                        standaloneCancellationWindow: labels.standaloneCancellationWindow,
                        standaloneLessonType: labels.standaloneLessonType,
                        updateStandaloneCta: labels.updateStandaloneCta,
                        updateTrainerCta: labels.updateTrainerCta,
                        attendeesLabel: labels.attendeesLabel,
                        noAttendees: labels.noAttendees,
                        attendeeSelectLabel: labels.attendeeSelectLabel,
                        addAttendeeCta: labels.addAttendeeCta,
                        removeAttendeeCta: labels.removeAttendeeCta,
                        waitlistLabel: labels.waitlistLabel,
                        noWaitlist: labels.noWaitlist,
                        confirmWaitlistCta: labels.confirmWaitlistCta,
                        removeWaitlistCta: labels.removeWaitlistCta,
                        processing: labels.processing,
                        closeCta: labels.closeCta,
                      }}
                      trigger={
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--surface-border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                          aria-label={labels.manageTriggerLabel}
                          title={labels.manageTriggerLabel}
                        >
                          <Pencil className="h-4 w-4 text-[var(--foreground)]" />
                        </button>
                      }
                    />
                    {!lesson.course?.id ? (
                      <form action={deleteStandaloneLessonAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="week" value={String(normalizedOffset)} />
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <button
                          type="submit"
                          className="inline-flex h-8 items-center rounded-md border border-red-300 px-2 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          {labels.deleteStandaloneCta}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

