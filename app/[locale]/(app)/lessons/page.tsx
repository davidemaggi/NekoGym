import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { prisma } from "@/lib/prisma";
import { RotateCcw, Trash2 } from "lucide-react";

import {
  deleteStandaloneLessonAction,
  restoreLessonAction,
} from "@/app/[locale]/(app)/lessons/actions";
import { BookingBadgeToggle } from "@/components/bookings/booking-badge-toggle";
import { LessonManageDialog } from "@/app/[locale]/(app)/lessons/lesson-manage-dialog";
import { LessonsFlashToast } from "@/app/[locale]/(app)/lessons/lessons-flash-toast";
import { StandaloneLessonCreateDialog } from "@/app/[locale]/(app)/lessons/standalone-lesson-create-dialog";
import { Badge } from "@/components/ui/badge";
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";

function parseMonthInput(value: string | undefined): { year: number; month: number } {
  if (!value) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  const year = Number.parseInt(match[1] ?? "", 10);
  const monthIndex = Number.parseInt(match[2] ?? "", 10) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  return { year, month: monthIndex };
}

function monthValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  searchParams: Promise<{ month?: string; flash?: string; flashType?: "success" | "error"; showDeleted?: string }>;
}) {
  const { locale } = await params;
  const { month, flash, flashType, showDeleted } = await searchParams;
  const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const dictionary = getDictionary(safeLocale);
  const labels = dictionary.lessonsPage;
  const bookingLabels = dictionary.bookings;
  const includeDeleted = currentUser.role === "ADMIN" && showDeleted === "1";

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
  const iconOptions = await getLessonTypeIconOptions();

  const attendeeCandidates = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const selectedMonth = parseMonthInput(month);
  const monthStart = new Date(selectedMonth.year, selectedMonth.month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(selectedMonth.year, selectedMonth.month + 1, 1, 0, 0, 0, 0);
  const previousMonth = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
  const nextMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 1);

  const lessons = await prisma.lesson.findMany({
    where: {
      deletedAt: includeDeleted ? undefined : null,
      startsAt: {
        gte: monthStart,
        lt: monthEnd,
      },
    },
    include: {
      course: { select: { id: true, name: true, trainerId: true, durationMinutes: true } },
      trainer: { select: { id: true, name: true } },
      lessonType: { select: { id: true, name: true, iconSvg: true, colorHex: true } },
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

  const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(monthStart);
    date.setDate(monthStart.getDate() + index);
    const key = dateKey(date);
    return {
      key,
      date,
      lessons: grouped.get(key) ?? [],
    };
  });

  const daysWithLessons = monthDays.filter((day) => day.lessons.length > 0);

  const dateFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
  const monthFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
    month: "long",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const monthLabel = monthFmt.format(monthStart);
  const now = new Date();
  const prevMonthHref = `/${locale}/lessons?month=${monthValue(previousMonth)}${includeDeleted ? "&showDeleted=1" : ""}`;
  const nextMonthHref = `/${locale}/lessons?month=${monthValue(nextMonth)}${includeDeleted ? "&showDeleted=1" : ""}`;
  const toggleDeletedHref = `/${locale}/lessons?month=${monthValue(monthStart)}${includeDeleted ? "" : "&showDeleted=1"}`;

  return (
    <section className="space-y-4">
      <LessonsFlashToast message={flash ?? null} type={flashType ?? null} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
        </div>

        <div className="inline-flex items-center gap-2 text-sm">
          <a className="text-[var(--foreground)] hover:underline" href={prevMonthHref}>
            {labels.prevMonth}
          </a>
          <span className="rounded-md bg-[var(--muted)] px-2 py-1 text-xs capitalize">{monthLabel}</span>
          <span className="rounded-md border border-[var(--surface-border)] px-2 py-1 text-xs">{labels.monthNavigationLabel}</span>
          <a className="text-[var(--foreground)] hover:underline" href={nextMonthHref}>
            {labels.nextMonth}
          </a>
          {currentUser.role === "ADMIN" ? (
            <a className="rounded-md border border-[var(--surface-border)] px-2 py-1 text-xs hover:bg-[var(--muted)]" href={toggleDeletedHref}>
              {includeDeleted ? labels.hideDeletedCta : labels.showDeletedCta}
            </a>
          ) : null}
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
                lessonTitleLabel: labels.lessonTitleLabel,
                lessonDescriptionLabel: labels.lessonDescriptionLabel,
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
                  const isDeleted = Boolean(lesson.deletedAt);
                  const isBookedByCurrentUser = lesson.bookings.some((booking) => booking.trainee.id === currentUser.id);
                  const isQueuedByCurrentUser = lesson.waitlistEntries.some((entry) => entry.trainee.id === currentUser.id);
                  const cancellationDeadline = new Date(lesson.startsAt.getTime() - lesson.cancellationWindowHours * 60 * 60 * 1000);
                  const canBook =
                    !isDeleted &&
                    lesson.status === "SCHEDULED" &&
                    lesson.startsAt > now &&
                    !isBookedByCurrentUser &&
                    !isQueuedByCurrentUser;
                  const canUnbook = !isDeleted && isBookedByCurrentUser && now <= cancellationDeadline;
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
                    {lesson.lessonType ? (
                      <LessonTypeIcon
                        iconPath={sanitizeLessonTypeIconPath(lesson.lessonType.iconSvg, iconOptions)}
                        colorHex={sanitizeLessonTypeColor(lesson.lessonType.colorHex)}
                        size={18}
                        title={lesson.lessonType.name}
                      />
                    ) : null}
                    <p className="font-medium">{lesson.title?.trim() || lesson.course?.name || "-"}</p>
                    {lesson.course?.id ? (
                      <Badge variant="info" className="text-[10px]">
                        {labels.courseTag}
                      </Badge>
                    ) : null}
                    {isDeleted ? (
                      <Badge variant="warning" className="text-[10px]">
                        {labels.deletedTag}
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
                  {lesson.description ? <p className="text-xs text-[var(--muted-foreground)]">{lesson.description}</p> : null}
                  <div className="mt-2 inline-flex gap-2">
                    {!isQueuedByCurrentUser ? (
                      <BookingBadgeToggle
                        locale={locale}
                        lessonId={lesson.id}
                        isBooked={isBookedByCurrentUser}
                        canBook={canBook}
                        canUnbook={canUnbook}
                        labels={{
                          bookCta: bookingLabels.bookCta,
                          bookedCta: bookingLabels.youAreBooked,
                          processing: bookingLabels.processing,
                        }}
                      />
                    ) : (
                      <Badge variant="warning">{bookingLabels.youAreQueued}</Badge>
                    )}
                    <LessonManageDialog
                      locale={locale}
                      lesson={{
                        id: lesson.id,
                        canEditMain: !lesson.course?.id && !isPastOrNow && !isDeleted,
                        title: lesson.title ?? "",
                        description: lesson.description ?? "",
                        startsAt: toDateTimeLocalValue(lesson.startsAt),
                        durationMinutes: Math.max(1, Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60000)),
                        maxAttendees: lesson.maxAttendees,
                        cancellationWindowHours: lesson.cancellationWindowHours,
                        trainerId: lesson.trainer?.id ?? "",
                        lessonTypeId: lesson.lessonTypeId ?? "",
                        canManageTrainer: currentUser.role === "ADMIN" && !isPastOrNow && !isDeleted,
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
                        lessonTitleLabel: labels.lessonTitleLabel,
                        lessonDescriptionLabel: labels.lessonDescriptionLabel,
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
                        manageTriggerLabel: labels.manageTriggerLabel,
                      }}
                    />
                    {!isDeleted ? (
                      <form action={deleteStandaloneLessonAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="month" value={monthValue(monthStart)} />
                        {includeDeleted ? <input type="hidden" name="showDeleted" value="1" /> : null}
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <button
                          type="submit"
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-red-300 px-2 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{labels.deleteLessonCta}</span>
                        </button>
                      </form>
                    ) : (
                      <form action={restoreLessonAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="month" value={monthValue(monthStart)} />
                        {includeDeleted ? <input type="hidden" name="showDeleted" value="1" /> : null}
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <button
                          type="submit"
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-300 px-2 text-xs text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>{labels.restoreLessonCta}</span>
                        </button>
                      </form>
                    )}
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
