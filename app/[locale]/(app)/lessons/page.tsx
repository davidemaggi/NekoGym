import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarX2, Check, ChevronLeft, ChevronRight, Plus, RotateCcw } from "lucide-react";

import { deleteStandaloneLessonAction, restoreLessonAction } from "@/app/[locale]/(app)/lessons/actions";
import { LessonsFlashToast } from "@/app/[locale]/(app)/lessons/lessons-flash-toast";
import { StandaloneLessonCreateDialog } from "@/app/[locale]/(app)/lessons/standalone-lesson-create-dialog";
import { fillNodes } from "@/components/bookings/pass-card";
import { LessonManageButton, type ManageableLesson } from "@/components/lessons/lesson-manage-button";
import { SeatStrip } from "@/components/lessons/seat-strip";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
import { requireAuth } from "@/lib/authorization";
import { appDateKey, appDateTimeLocalValue, appStartOfDayUtc, getAppDateParts, getAppDateTimeConfig } from "@/lib/date-time";
import { staffCertificateNote } from "@/lib/medical-certificate";
import { getDictionary, isLocale } from "@/lib/i18n";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { withLessonPlanUsage } from "@/lib/plan-usage";
import { prisma } from "@/lib/prisma";
import { parseClosedDatesCsv, parseOpenWeekdaysCsv } from "@/lib/site-settings";
import { textLinkActionClass } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

function monthParam(year: number, month: number) {
  const normalized = new Date(Date.UTC(year, month - 1, 1));
  return `${normalized.getUTCFullYear()}-${String(normalized.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function LessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; flash?: string; flashType?: "success" | "error"; showDeleted?: string; showPast?: string; mine?: string }>;
}) {
  const { locale } = await params;
  const { month, flash, flashType, showDeleted, showPast, mine } = await searchParams;
  const currentUser = await requireAuth(locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  // Lessons is a staff screen; members book from Bookings.
  if (currentUser.role === "TRAINEE") redirect(`/${safeLocale}/bookings`);

  const dictionary = getDictionary(safeLocale);
  const labels = dictionary.lessonsPage;
  const isAdmin = currentUser.role === "ADMIN";
  const isTrainer = currentUser.role === "TRAINER";
  const includeDeleted = showDeleted === "1";
  const includePast = showPast === "1";
  // Trainers start on their own lessons; they can widen to the whole gym.
  const onlyMine = isTrainer && mine !== "0";
  const { timeZone } = getAppDateTimeConfig();
  const intlLocale = safeLocale === "it" ? "it-IT" : "en-GB";
  const now = new Date();

  const today = getAppDateParts(now);
  const todayStart = appStartOfDayUtc(today.year, today.month, today.day);
  const todayKey = appDateKey(now);
  const match = MONTH_PATTERN.exec(month ?? "");
  const year = match ? Number.parseInt(match[1], 10) : today.year;
  const monthNumber = match ? Math.min(12, Math.max(1, Number.parseInt(match[2], 10))) : today.month;
  const monthStart = appStartOfDayUtc(year, monthNumber, 1);
  const monthEnd = appStartOfDayUtc(year, monthNumber + 1, 1);
  const currentMonth = monthParam(year, monthNumber);

  const [iconOptions, siteSettings, trainerCandidates, lessonTypeCandidates, attendeeCandidates] = await Promise.all([
    getLessonTypeIconOptions(),
    prisma.siteSettings.findUnique({ where: { id: 1 }, select: { openWeekdaysCsv: true, closedDatesCsv: true } }),
    isAdmin
      ? prisma.user.findMany({ where: { role: { in: ["ADMIN", "TRAINER"] } }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([{ id: currentUser.id, name: currentUser.name }]),
    prisma.lessonType.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
  ]);

  const lessons = await prisma.lesson.findMany({
    where: {
      deletedAt: includeDeleted ? undefined : null,
      // Default lower bound is the start of today (gym time zone): lessons in progress or ended today stay listed.
      startsAt: { gte: includePast || monthStart > todayStart ? monthStart : todayStart, lt: monthEnd },
      ...(onlyMine ? { trainerId: currentUser.id } : {}),
    },
    include: {
      course: { select: { id: true, name: true, description: true, trainerId: true, durationMinutes: true } },
      trainer: { select: { id: true, name: true } },
      lessonType: { select: { name: true, iconSvg: true, colorHex: true } },
      bookings: { select: { status: true, attendanceStatus: true, trainee: { select: { id: true, name: true, email: true, medicalCertificateExpiresAt: true } } } },
      waitlistEntries: { select: { trainee: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { startsAt: "asc" },
  });

  const timeFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const dayFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, weekday: "long", day: "numeric", month: "long" });
  const monthFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, month: "long", year: "numeric" });

  type Row = ManageableLesson & {
    dayKey: string;
    timeLabel: string;
    endTimeLabel: string;
    bookedCount: number;
    pendingCount: number;
    isDeleted: boolean;
    modifiedReasons: Array<"trainer" | "time">;
    isCustomizedOnly: boolean;
    phase: "ended" | "inProgress" | "upcoming";
  };

  // Plan spent by each person in the lesson's own week/month (staff only reads it).
  const planUsage = await withLessonPlanUsage(prisma, lessons, (lesson) => [
    ...lesson.bookings.map((booking) => booking.trainee),
    ...lesson.waitlistEntries.map((entry) => entry.trainee),
  ]);
  const withUsage = <P extends { id: string }>(lessonId: string, person: P) => ({
    ...person,
    planUsage: planUsage.get(lessonId)?.get(person.id),
  });
  const rows: Row[] = lessons.map((lesson) => {
    const confirmed = lesson.bookings.filter((booking) => booking.status === "CONFIRMED");
    const canManageLesson = isAdmin || lesson.trainerId === currentUser.id;
    const isDeleted = Boolean(lesson.deletedAt);
    // A generated lesson that no longer matches its course (time or trainer changed by hand).
    const modifiedReasons = new Set<"trainer" | "time">();
    if (lesson.course && !isDeleted) {
      if (lesson.trainerId !== lesson.course.trainerId) modifiedReasons.add("trainer");
      const duration = Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60000);
      if (duration !== lesson.course.durationMinutes) modifiedReasons.add("time");
      if (lesson.sourceStartTime && lesson.sourceStartTime !== timeFormat.format(lesson.startsAt)) modifiedReasons.add("time");
    }
    return {
      id: lesson.id,
      dayKey: appDateKey(lesson.startsAt),
      title: lesson.title ?? null,
      description: lesson.description ?? null,
      startsAt: lesson.startsAt.toISOString(),
      endsAt: lesson.endsAt.toISOString(),
      startsAtLocal: appDateTimeLocalValue(lesson.startsAt),
      timeLabel: timeFormat.format(lesson.startsAt),
      endTimeLabel: timeFormat.format(lesson.endsAt),
      durationMinutes: Math.max(1, Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60000)),
      hasStarted: lesson.startsAt <= now,
      maxAttendees: lesson.maxAttendees,
      cancellationWindowHours: lesson.cancellationWindowHours,
      trainerId: lesson.trainerId ?? "",
      trainerName: lesson.trainer?.name ?? null,
      lessonTypeId: lesson.lessonTypeId ?? "",
      lessonTypeName: lesson.lessonType?.name ?? null,
      lessonTypeIcon: lesson.lessonType ? sanitizeLessonTypeIconPath(lesson.lessonType.iconSvg, iconOptions) : null,
      lessonTypeColor: lesson.lessonType ? sanitizeLessonTypeColor(lesson.lessonType.colorHex) : null,
      isCourseLesson: Boolean(lesson.course?.id),
      courseName: lesson.course?.name ?? "-",
      courseId: lesson.course?.id ?? null,
      courseDescription: lesson.course?.description?.trim() || null,
      bookedCount: confirmed.length,
      pendingCount: lesson.bookings.length - confirmed.length,
      occupancy: `${confirmed.length}/${lesson.maxAttendees}`,
      queueLength: lesson.waitlistEntries.length,
      canViewWaitlist: true,
      canManageLesson,
      canManageAttendance: canManageLesson && lesson.endsAt <= now && !isDeleted,
      attendees: confirmed.map((booking) => withUsage(lesson.id, booking.trainee)),
      attendeeAttendance: Object.fromEntries(confirmed.map((booking) => [booking.trainee.id, booking.attendanceStatus ?? null])),
      pendingApprovals: lesson.bookings
        .filter((booking) => booking.status === "PENDING")
        .map((booking) => {
          const { medicalCertificateExpiresAt, ...trainee } = booking.trainee;
          return {
            ...withUsage(lesson.id, trainee),
            approvalNote: staffCertificateNote(medicalCertificateExpiresAt, lesson.startsAt, safeLocale, getAppDateTimeConfig().timeZone, now),
          };
        }),
      waitlist: lesson.waitlistEntries.map((entry) => withUsage(lesson.id, entry.trainee)),
      isDeleted,
      modifiedReasons: Array.from(modifiedReasons),
      // (On a cancelled lesson isCustomized only marks a staff cancellation, not an edit.)
      isCustomizedOnly: Boolean(lesson.course) && !isDeleted && lesson.isCustomized && modifiedReasons.size === 0,
      phase: lesson.endsAt <= now ? "ended" : lesson.startsAt <= now ? "inProgress" : "upcoming",
    };
  });

  const days = new Map<string, Row[]>();
  for (const row of rows) days.set(row.dayKey, [...(days.get(row.dayKey) ?? []), row]);
  const monthPeople = rows.filter((row) => !row.isDeleted).reduce((sum, row) => sum + row.bookedCount, 0);
  const activeCount = rows.filter((row) => !row.isDeleted).length;

  const href = (overrides: Partial<Record<"month" | "showDeleted" | "showPast" | "mine", string | null>>) => {
    const state = {
      month: currentMonth,
      showDeleted: includeDeleted ? "1" : null,
      showPast: includePast ? "1" : null,
      mine: isTrainer && !onlyMine ? "0" : null,
      ...overrides,
    };
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) if (value) search.set(key, value);
    return `/${safeLocale}/lessons?${search.toString()}`;
  };

  const hiddenState = (
    <>
      <input type="hidden" name="locale" value={safeLocale} />
      <input type="hidden" name="month" value={currentMonth} />
      {includeDeleted ? <input type="hidden" name="showDeleted" value="1" /> : null}
      {includePast ? <input type="hidden" name="showPast" value="1" /> : null}
      {isTrainer ? <input type="hidden" name="mine" value={onlyMine ? "1" : "0"} /> : null}
    </>
  );

  const filters: Array<{ label: string; active: boolean; href: string }> = [
    ...(isTrainer ? [{ label: labels.onlyMineCta, active: onlyMine, href: href({ mine: onlyMine ? "0" : null }) }] : []),
    { label: labels.showPastCta, active: includePast, href: href({ showPast: includePast ? null : "1" }) },
    { label: labels.showDeletedCta, active: includeDeleted, href: href({ showDeleted: includeDeleted ? null : "1" }) },
  ];

  const manageProps = {
    locale: safeLocale,
    labels: dictionary.bookings,
    lessonCreateLabels: labels,
    canUpdateTrainer: isAdmin,
    isAdmin,
    trainerCandidates,
    lessonTypeCandidates,
    attendeeCandidates,
  };

  return (
    <div>
      <LessonsFlashToast message={flash ?? null} type={flashType ?? null} />

      <div
        data-page-band
        className="-mt-4 bg-[var(--stock)] pb-5 pt-1 shadow-[0_0_0_100vmax_var(--stock)] [clip-path:inset(0_-100vmax)] lg:-mt-10 lg:pb-6 lg:pt-10"
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.375rem] font-bold leading-tight lg:text-[2rem]">{labels.title}</h1>
            <p className="mt-1 text-[15px] text-[var(--stock-ink)]/75">
              {fillNodes(labels.monthLessonsSummary, {
                lessons: <span className="tabular">{activeCount}</span>,
                people: <span className="tabular">{monthPeople}</span>,
              })}
            </p>
          </div>
          <StandaloneLessonCreateDialog
            locale={safeLocale}
            trainerCandidates={trainerCandidates}
            lessonTypeCandidates={lessonTypeCandidates}
            openWeekdays={parseOpenWeekdaysCsv(siteSettings?.openWeekdaysCsv)}
            closedDates={parseClosedDatesCsv(siteSettings?.closedDatesCsv)}
            defaultTrainerId={isTrainer ? currentUser.id : undefined}
            disableTrainerSelection={isTrainer}
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
            trigger={
              <Button aria-label={labels.createStandaloneCta} className="w-11 px-0 sm:w-auto sm:px-4">
                <Plus size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{labels.createStandaloneCta}</span>
              </Button>
            }
          />
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <nav aria-label={labels.monthNavigationLabel} className="inline-flex items-center gap-1">
            <Link
              href={href({ month: monthParam(year, monthNumber - 1) })}
              aria-label={labels.prevMonth}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-[var(--surface)]/70"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </Link>
            <span className="min-w-[9.5rem] text-center text-[17px] font-semibold first-letter:uppercase">
              {monthFormat.format(new Date(monthStart.getTime() + 12 * 60 * 60 * 1000))}
            </span>
            <Link
              href={href({ month: monthParam(year, monthNumber + 1) })}
              aria-label={labels.nextMonth}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-[var(--surface)]/70"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </Link>
          </nav>
          <ul aria-label={labels.filtersLabel} className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <li key={filter.label}>
                <Link
                  href={filter.href}
                  role="button"
                  aria-pressed={filter.active}
                  className={cn(
                    "inline-flex h-11 items-center gap-1.5 rounded-xl border-[1.5px] px-3.5 text-[15px] font-semibold transition-colors",
                    filter.active
                      ? "border-[var(--foreground)] bg-[var(--surface)] text-[var(--foreground)]"
                      : "border-[var(--stock-edge)] text-[var(--stock-ink)]/80 hover:bg-[var(--surface)]/60"
                  )}
                >
                  {filter.active ? <Check size={16} aria-hidden="true" /> : null}
                  {filter.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {days.size === 0 ? (
        <div className="pt-8">
          <h2 className="text-[17px] font-semibold">{labels.emptyMonthTitle}</h2>
          <p className="mt-1 max-w-[60ch] text-[15px] text-[var(--muted-foreground)]">
            {filters.some((filter) => filter.active && filter.label !== labels.onlyMineCta) || onlyMine
              ? labels.emptyMonthFiltered
              : labels.emptyMonth}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6">
            {currentMonth !== monthParam(today.year, today.month) ? (
              <Link href={href({ month: monthParam(today.year, today.month) })} className={textLinkActionClass}>
                {labels.backToCurrentMonth}
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            ) : null}
            {onlyMine ? (
              <Link href={href({ mine: "0" })} className={textLinkActionClass}>
                {labels.showAllLessonsCta}
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-6 pt-6">
          {Array.from(days.entries()).map(([dayKey, dayRows]) => (
            <section key={dayKey} aria-labelledby={`day-${dayKey}`}>
              <h2 id={`day-${dayKey}`} className="flex items-baseline justify-between gap-2 text-[17px] font-semibold">
                <span className="first-letter:uppercase">
                  {dayFormat.format(new Date(dayRows[0].startsAt))}
                  {dayKey === todayKey ? (
                    <span className="ml-2 rounded-lg bg-[var(--surface)] px-2 py-0.5 align-[2px] text-[13px] font-semibold">{labels.todayTag}</span>
                  ) : null}
                </span>
                <span className="text-[15px] font-medium text-[var(--muted-foreground)]">
                  {dayRows.length === 1
                    ? labels.lessonsCountOne
                    : fillNodes(labels.lessonsCount, { n: <span className="tabular">{dayRows.length}</span> })}
                </span>
              </h2>
              <ul className="-mx-4 mt-1 sm:mx-0">
                {dayRows.map((lesson) => {
                  const name = lesson.title ?? lesson.courseName;
                  const muted = lesson.isDeleted || lesson.phase === "ended";
                  const meta = [
                    lesson.trainerName,
                    lesson.isCourseLesson ? null : labels.standaloneTag,
                    lesson.queueLength > 0 ? `${labels.waitlistLabel} ${lesson.queueLength}` : null,
                  ].filter(Boolean);
                  return (
                    <li
                      key={lesson.id}
                      className={cn(
                        "grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-[var(--rule)] px-4 py-3.5 last:border-b-0 sm:grid-cols-[4.25rem_minmax(0,1fr)_8.5rem_auto] sm:px-0",
                        lesson.phase === "inProgress" && !lesson.isDeleted
                          ? "my-1 border-b-0 bg-[var(--surface)] shadow-[var(--shadow-lift)] sm:-mx-4 sm:rounded-2xl sm:px-4"
                          : ""
                      )}
                    >
                      <p className={cn("leading-none", muted ? "text-[var(--muted-foreground)]" : "")}>
                        <span className="tabular block text-[1.375rem] font-bold sm:text-[1.625rem]">{lesson.timeLabel}</span>
                        <span className="tabular mt-1 block text-[13px] font-medium text-[var(--muted-foreground)]">
                          {lesson.durationMinutes} min
                        </span>
                        <span className={cn("tabular mt-1 block text-[13px] font-semibold sm:hidden", muted ? "" : "text-[var(--foreground)]")}>
                          {lesson.occupancy}
                          {lesson.pendingCount > 0 ? ` +${lesson.pendingCount}` : ""}
                        </span>
                      </p>
                      <div className="min-w-0">
                        <p className={cn("flex items-start gap-2 text-[17px] font-semibold leading-snug", lesson.isDeleted ? "text-[var(--muted-foreground)] line-through decoration-1" : "")}>
                          {lesson.lessonTypeIcon ? (
                            <LessonTypeIcon iconPath={lesson.lessonTypeIcon} colorHex={lesson.lessonTypeColor} size={18} className="mt-[3px]" />
                          ) : null}
                          <span className="min-w-0 break-words">{name}</span>
                        </p>
                        <p className="mt-0.5 text-[15px] text-[var(--muted-foreground)]">{meta.join(" · ")}</p>
                        {lesson.isDeleted || lesson.modifiedReasons.length > 0 || lesson.isCustomizedOnly ? (
                          <p className="mt-1.5 flex flex-wrap gap-1.5">
                            {lesson.isDeleted ? (
                              <span className="rounded-lg bg-[var(--danger-bg)] px-2 py-0.5 text-[13px] font-semibold text-[var(--danger-fg)]">
                                {labels.cancelledTag}
                              </span>
                            ) : null}
                            {lesson.modifiedReasons.length > 0 || lesson.isCustomizedOnly ? (
                              <span className="rounded-lg bg-[var(--warning-bg)] px-2 py-0.5 text-[13px] font-semibold text-[var(--warning-fg)]">
                                {labels.modifiedTag}
                                {lesson.modifiedReasons.length > 0
                                  ? `: ${lesson.modifiedReasons
                                      .map((reason) => (reason === "trainer" ? labels.modifiedReasonTrainer : labels.modifiedReasonTime))
                                      .join(", ")}`
                                  : null}
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                      </div>
                      <div className="hidden sm:block">
                        <SeatStrip
                          booked={lesson.bookedCount}
                          pending={lesson.pendingCount}
                          max={lesson.maxAttendees}
                          label={`${labels.bookedLabel} ${lesson.occupancy}`}
                          muted={lesson.isDeleted}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        {lesson.canManageLesson && !lesson.isDeleted ? (
                          <LessonManageButton
                            {...manageProps}
                            lesson={lesson}
                            triggerLabel={labels.manageTitle}
                            triggerShortLabel={labels.manageCta}
                            peopleAction
                            footerSlot={
                              lesson.phase === "upcoming" ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)] sm:mr-auto">
                                      <CalendarX2 size={18} aria-hidden="true" />
                                      {labels.deleteLessonCta}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{labels.confirmDeleteLessonTitle}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {name} · <span className="tabular">{lesson.timeLabel}</span>. {labels.confirmDeleteLessonDescription}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel asChild>
                                        <Button variant="outline">{labels.closeCta}</Button>
                                      </AlertDialogCancel>
                                      <form action={deleteStandaloneLessonAction} className="contents">
                                        {hiddenState}
                                        <input type="hidden" name="lessonId" value={lesson.id} />
                                        <Button type="submit" variant="destructive">
                                          {labels.deleteLessonCta}
                                        </Button>
                                      </form>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : null
                            }
                          />
                        ) : null}
                        {lesson.canManageLesson && lesson.isDeleted ? (
                          <form action={restoreLessonAction}>
                            {hiddenState}
                            <input type="hidden" name="lessonId" value={lesson.id} />
                            <Button type="submit" variant="outline">
                              <RotateCcw size={16} aria-hidden="true" />
                              {labels.restoreLessonCta}
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
