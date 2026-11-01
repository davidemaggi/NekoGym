import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CalendarCheck, ChevronRight } from "lucide-react";

import { requireAuth } from "@/lib/authorization";
import { appDayRange } from "@/lib/booking-rules";
import { appDateKey, appDateTimeLocalValue, appStartOfDayUtc, getAppDateParts, getAppDateTimeConfig } from "@/lib/date-time";
import { staffCertificateNote } from "@/lib/medical-certificate";
import { CertificateNotice } from "@/components/users/certificate-notice";
import { getDictionary, isLocale } from "@/lib/i18n";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { loadMemberPass } from "@/lib/member-pass";
import { withLessonPlanUsage } from "@/lib/plan-usage";
import { prisma } from "@/lib/prisma";
import { textLinkActionClass } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { PassCard, fill, fillNodes } from "@/components/bookings/pass-card";
import { LessonManageButton, type ManageableLesson } from "@/components/lessons/lesson-manage-button";
import { SeatStrip } from "@/components/lessons/seat-strip";
import { PwaInstallBanner } from "@/components/pwa/install-banner";
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
import { DashboardCrowdingChart } from "@/app/[locale]/(app)/dashboard-crowding-chart";
import { DashboardPendingApprovals } from "@/app/[locale]/(app)/dashboard-pending-approvals";
import { DashboardTypeChart, type TypeChartLesson } from "@/app/[locale]/(app)/dashboard-type-chart";

type HomeLesson = ManageableLesson & {
  timeLabel: string;
  bookedCount: number;
  pendingCount: number;
  phase: "ended" | "inProgress" | "upcoming";
};


/** Seat strip: one segment per seat up to 16, a continuous bar beyond. */



function TodoItem({
  count,
  icon,
  tone,
  title,
  children,
}: {
  count?: number;
  icon?: ReactNode;
  tone: "warning" | "info" | "danger";
  title: string;
  children: ReactNode;
}) {
  const toneClass = {
    warning: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
    info: "bg-[var(--info-bg)] text-[var(--info-fg)]",
    danger: "bg-[var(--danger-bg)] text-[var(--danger-fg)]",
  }[tone];
  return (
    <li className="flex gap-3 border-b border-[var(--rule)] py-4 first:pt-1 last:border-b-0">
      <span aria-hidden="true" className={cn("tabular inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold", toneClass)}>
        {icon ?? count}
      </span>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold">
          {title}
          {count !== undefined ? <span className="sr-only">: {count}</span> : null}
        </h3>
        {children}
      </div>
    </li>
  );
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ crowdingDay?: string }>;
}) {
  const { locale } = await params;
  const { crowdingDay } = await searchParams;
  const currentUser = await requireAuth(locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const dictionary = getDictionary(safeLocale);
  const labels = dictionary.appPages.dashboard;
  const home = labels.home;
  const now = new Date();
  const { timeZone } = getAppDateTimeConfig();
  const intlLocale = safeLocale === "it" ? "it-IT" : "en-GB";
  const iconOptions = await getLessonTypeIconOptions();
  const isStaff = currentUser.role === "ADMIN" || currentUser.role === "TRAINER";
  const trainerScope = currentUser.role === "TRAINER" ? { trainerId: currentUser.id } : {};

  const timeFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const longDayFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, weekday: "long", day: "numeric", month: "long" });
  const shortWhenFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, weekday: "short", day: "numeric", month: "short" });
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(now));
  const greeting = fill(hour < 13 ? home.greetingMorning : hour < 18 ? home.greetingAfternoon : home.greetingEvening, {
    name: currentUser.name.split(" ")[0] ?? currentUser.name,
  });
  const todayLabel = longDayFormat.format(now);
  const today = appDayRange(now);

  // Lessons-per-type chart, current year only: the whole gym for admins, own lessons (taught or booked) otherwise.
  const { year } = getAppDateParts(now);
  const typeChartLessons = await prisma.lesson.findMany({
    where: {
      deletedAt: null,
      status: "SCHEDULED",
      startsAt: { gte: appStartOfDayUtc(year, 1, 1), lt: appStartOfDayUtc(year + 1, 1, 1) },
      ...(currentUser.role === "ADMIN"
        ? {}
        : {
            OR: [
              { trainerId: currentUser.id },
              { bookings: { some: { traineeId: currentUser.id, status: { in: ["CONFIRMED", "PENDING"] } } } },
            ],
          }),
    },
    select: { startsAt: true, lessonType: { select: { name: true, colorHex: true } } },
  });
  const typeChartData: TypeChartLesson[] = typeChartLessons.map((lesson) => ({
    startsAt: lesson.startsAt.toISOString(),
    lessonTypeName: lesson.lessonType?.name ?? "-",
    lessonTypeColor: lesson.lessonType ? sanitizeLessonTypeColor(lesson.lessonType.colorHex) : null,
  }));
  const typeChart = (
    <DashboardTypeChart
      locale={safeLocale}
      lessons={typeChartData}
      defaultRange={isStaff ? "month" : "week"}
      labels={{
        chartTitle: labels.userInsights.chartTitle,
        chartDescription: labels.userInsights.chartDescription,
        chartRangeLabel: labels.userInsights.chartRangeLabel,
        chartRangeWeek: labels.userInsights.chartRangeWeek,
        chartRangeMonth: labels.userInsights.chartRangeMonth,
        chartRangeYear: labels.userInsights.chartRangeYear,
        chartEmpty: labels.userInsights.chartEmpty,
        chartFutureSuffix: labels.userInsights.chartFutureSuffix,
        chartFutureNote: labels.userInsights.chartFutureNote,
      }}
    />
  );

  /* ---------------------------------------------------------------- */
  /* Member home                                                       */
  /* ---------------------------------------------------------------- */
  if (!isStaff) {
    const { pass, upcoming } = await loadMemberPass({
      userId: currentUser.id,
      role: currentUser.role,
      locale: safeLocale,
      iconOptions,
      now,
    });
    const [next, ...later] = upcoming;
    const certificate = await prisma.user.findUnique({ where: { id: currentUser.id }, select: { medicalCertificateExpiresAt: true } });
    const bookingsHref = (dayKey?: string) => `/${safeLocale}/bookings${dayKey ? `?day=${dayKey}` : ""}`;

    return (
      <div className="mx-auto max-w-3xl">
        <div
          data-page-band
          className="-mt-4 bg-[var(--stock)] pb-6 pt-1 shadow-[0_0_0_100vmax_var(--stock)] [clip-path:inset(0_-100vmax)] lg:-mt-10 lg:pt-10"
        >
          <header>
            <h1 className="text-[1.375rem] font-bold leading-tight lg:text-[2rem]">{greeting}</h1>
            <p className="mt-1 text-[15px] text-[var(--stock-ink)]/75 first-letter:uppercase">{todayLabel}</p>
          </header>
          <div className="mt-5 space-y-3 empty:hidden">
            <CertificateNotice
              expiresAt={certificate?.medicalCertificateExpiresAt ?? null}
              locale={safeLocale}
              timeZone={getAppDateTimeConfig().timeZone}
            />
            {pass ? <PassCard pass={pass} labels={dictionary.bookings.pass} /> : null}
          </div>
        </div>

        <PwaInstallBanner labels={dictionary.pwaInstall} />

        <section aria-labelledby="next-heading" className="pt-6">
          <h2 id="next-heading" className="text-[17px] font-semibold">{home.nextLessonTitle}</h2>
          {next ? (
            <Link
              href={bookingsHref(next.dayKey)}
              className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 rounded-2xl bg-[var(--surface)] p-4 shadow-[var(--shadow-lift)] transition-colors hover:bg-[var(--surface-sunken)] sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:p-5"
            >
              {/* Phones read it like a ticket: time and stamp on top, the lesson below at full width. */}
              <span className="tabular text-[2rem] font-bold leading-none">{next.timeLabel}</span>
              <span className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                <span className="flex items-start gap-2 text-[17px] font-semibold leading-snug">
                  {next.lessonTypeIcon ? (
                    <LessonTypeIcon iconPath={next.lessonTypeIcon} colorHex={next.lessonTypeColor} size={18} className="mt-[3px]" />
                  ) : null}
                  <span className="min-w-0 break-words">{next.title}</span>
                </span>
                <span className="mt-0.5 block text-[15px] text-[var(--muted-foreground)] first-letter:uppercase">
                  <span className="tabular">{next.dateLabel}</span>
                  {next.trainerName ? ` · ${next.trainerName}` : null}
                </span>
              </span>
              <span
                className={cn(
                  "col-start-2 row-start-1 inline-flex min-w-[5.75rem] flex-col items-center justify-self-end rounded-lg border-2 border-[var(--stamp)] px-2 py-1.5 text-center leading-tight text-[var(--stamp)] sm:col-start-3",
                  next.isPending ? "border-dashed" : ""
                )}
              >
                <span className="text-[11px] font-extrabold uppercase tracking-[0.08em]">
                  {next.isPending ? dictionary.bookings.stampPending : dictionary.bookings.stampBooked}
                </span>
                <span className="tabular text-[15px] font-bold">{next.stampDateLabel}</span>
              </span>
            </Link>
          ) : (
            <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{home.memberEmpty}</p>
          )}

          {later.length > 0 ? (
            <>
              <h2 className="mt-7 text-[17px] font-semibold">{home.laterTitle}</h2>
              <ul className="mt-1">
                {later.map((item) => (
                  <li key={item.id} className="border-b border-[var(--rule)] last:border-b-0">
                    <Link
                      href={bookingsHref(item.dayKey)}
                      className="-mx-2 grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-[var(--surface)]"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-semibold">
                          {item.lessonTypeIcon ? (
                            <LessonTypeIcon iconPath={item.lessonTypeIcon} colorHex={item.lessonTypeColor} size={16} />
                          ) : null}
                          <span className="truncate">{item.title}</span>
                        </span>
                        <span className="tabular mt-0.5 block text-[15px] text-[var(--muted-foreground)] first-letter:uppercase">
                          {item.whenLabel}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "rounded-lg border-2 border-[var(--stamp)] px-2 py-1 text-xs font-extrabold uppercase tracking-[0.06em] text-[var(--stamp)]",
                          item.isPending ? "border-dashed" : ""
                        )}
                      >
                        {item.isPending ? dictionary.bookings.stampPending : dictionary.bookings.stampBooked}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <Link
            href={bookingsHref()}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-[15px] font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <CalendarCheck size={18} aria-hidden="true" />
            {home.bookCta}
          </Link>
        </section>

        <div className="mt-10 border-t border-[var(--rule)] pt-6">{typeChart}</div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Staff home: today on the left, to-do on the right                 */
  /* ---------------------------------------------------------------- */
  const [trainerCandidates, lessonTypeCandidates, attendeeCandidates] = await Promise.all([
    currentUser.role === "ADMIN"
      ? prisma.user.findMany({ where: { role: { in: ["ADMIN", "TRAINER"] } }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([{ id: currentUser.id, name: currentUser.name }]),
    prisma.lessonType.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
  ]);

  const todayLessons = await prisma.lesson.findMany({
    where: { status: "SCHEDULED", deletedAt: null, startsAt: { gte: today.start, lt: today.end }, ...trainerScope },
    include: {
      course: { select: { id: true, name: true, description: true } },
      trainer: { select: { id: true, name: true } },
      lessonType: { select: { name: true, iconSvg: true, colorHex: true } },
      bookings: {
        select: { status: true, attendanceStatus: true, trainee: { select: { id: true, name: true, email: true, medicalCertificateExpiresAt: true } } },
      },
      waitlistEntries: {
        select: { trainee: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  // Plan spent by each person in the lesson's own week/month (staff only reads it).
  const planUsage = await withLessonPlanUsage(prisma, todayLessons, (lesson) => [
    ...lesson.bookings.map((booking) => booking.trainee),
    ...lesson.waitlistEntries.map((entry) => entry.trainee),
  ]);
  const withUsage = <P extends { id: string }>(lessonId: string, person: P) => ({
    ...person,
    planUsage: planUsage.get(lessonId)?.get(person.id),
  });
  const rows: HomeLesson[] = todayLessons.map((lesson) => {
    const confirmed = lesson.bookings.filter((booking) => booking.status === "CONFIRMED");
    const canManageLesson = currentUser.role === "ADMIN" || lesson.trainerId === currentUser.id;
    return {
      id: lesson.id,
      title: lesson.title ?? null,
      description: lesson.description ?? null,
      startsAt: lesson.startsAt.toISOString(),
      endsAt: lesson.endsAt.toISOString(),
      startsAtLocal: appDateTimeLocalValue(lesson.startsAt),
      timeLabel: timeFormat.format(lesson.startsAt),
      durationMinutes: Math.max(1, Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60000)),
      hasStarted: lesson.startsAt <= now,
      phase: lesson.endsAt <= now ? "ended" : lesson.startsAt <= now ? "inProgress" : "upcoming",
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
      canManageAttendance: canManageLesson && lesson.endsAt <= now,
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
    };
  });
  const peopleToday = rows.reduce((sum, lesson) => sum + lesson.bookedCount, 0);
  const summary =
    rows.length === 0
      ? home.summaryNone
      : fill(rows.length === 1 ? home.summaryTodayOne : home.summaryToday, { lessons: rows.length, people: peopleToday });

  // To-do 1: booking requests waiting for staff confirmation.
  const pendingApprovals = await prisma.lessonBooking.findMany({
    where: { status: "PENDING", lesson: { status: "SCHEDULED", deletedAt: null, startsAt: { gt: now }, ...trainerScope } },
    select: {
      lessonId: true,
      traineeId: true,
      trainee: { select: { name: true, medicalCertificateExpiresAt: true } },
      lesson: { select: { title: true, startsAt: true, course: { select: { name: true } }, lessonType: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  // To-do 2: lessons that ended today with attendance still unmarked (the nightly job marks the rest PRESENT).
  const attendanceToMark = rows.filter(
    (lesson) => lesson.phase === "ended" && lesson.canManageLesson && Object.values(lesson.attendeeAttendance).some((value) => value === null)
  );

  // To-do 3: empty lessons whose auto-cancel deadline falls within the next 24 hours.
  const riskCandidates = await prisma.lesson.findMany({
    where: {
      status: "SCHEDULED",
      deletedAt: null,
      startsAt: { gt: now, lt: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000) },
      bookings: { none: {} },
      ...trainerScope,
    },
    select: { id: true, title: true, startsAt: true, cancellationWindowHours: true, course: { select: { name: true } } },
    orderBy: { startsAt: "asc" },
  });
  const atRisk = riskCandidates
    .map((lesson) => ({ ...lesson, deadline: new Date(lesson.startsAt.getTime() - lesson.cancellationWindowHours * 60 * 60 * 1000) }))
    .filter((lesson) => lesson.deadline > now && lesson.deadline.getTime() - now.getTime() <= 24 * 60 * 60 * 1000);

  const todoCount = (pendingApprovals.length > 0 ? 1 : 0) + attendanceToMark.length + atRisk.length;
  const manageProps = {
    locale: safeLocale,
    labels: dictionary.bookings,
    lessonCreateLabels: dictionary.lessonsPage,
    canUpdateTrainer: currentUser.role === "ADMIN",
    isAdmin: currentUser.role === "ADMIN",
    trainerCandidates,
    lessonTypeCandidates,
    attendeeCandidates,
  };

  // Crowding: average attendees per hour slot on the selected weekday, over the last 12 weeks.
  const selectedCrowdingKey = crowdingDay && /^\d{4}-\d{2}-\d{2}$/.test(crowdingDay) ? crowdingDay : appDateKey(now);
  const [cy, cm, cd] = selectedCrowdingKey.split("-").map((part) => Number.parseInt(part, 10));
  const crowdingStart = appStartOfDayUtc(cy, cm, cd);
  const crowdingEnd = appStartOfDayUtc(cy, cm, cd + 1);
  const targetWeekday = getAppDateParts(crowdingStart).weekday;
  const crowdingLessons = await prisma.lesson.findMany({
    where: {
      deletedAt: null,
      status: "SCHEDULED",
      startsAt: { gte: appStartOfDayUtc(cy, cm, cd - 84), lt: crowdingEnd },
      ...trainerScope,
    },
    select: { startsAt: true, bookings: { where: { status: "CONFIRMED" }, select: { id: true } } },
  });
  const byHour = new Map<number, { lessons: number; bookings: number }>();
  const sampleDays = new Set<string>();
  const hourFormat = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" });
  for (const lesson of crowdingLessons) {
    if (getAppDateParts(lesson.startsAt).weekday !== targetWeekday) continue;
    const slot = Number(hourFormat.format(lesson.startsAt));
    const entry = byHour.get(slot) ?? { lessons: 0, bookings: 0 };
    entry.lessons += 1;
    entry.bookings += lesson.bookings.length;
    byHour.set(slot, entry);
    sampleDays.add(appDateKey(lesson.startsAt));
  }
  const crowdingRows = Array.from(byHour.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([slot, value]) => ({
      hourLabel: `${String(slot).padStart(2, "0")}:00`,
      avgAttendees: Math.round((value.bookings / Math.max(1, value.lessons)) * 10) / 10,
      lessonsCount: value.lessons,
    }));

  return (
    <div>
      <div
        data-page-band
        className="-mt-4 bg-[var(--stock)] pb-6 pt-1 shadow-[0_0_0_100vmax_var(--stock)] [clip-path:inset(0_-100vmax)] lg:-mt-10 lg:pb-8 lg:pt-10"
      >
        <header>
          <h1 className="text-[1.375rem] font-bold leading-tight lg:text-[2rem]">{greeting}</h1>
          <p className="mt-1 text-[15px] text-[var(--stock-ink)]/75">
            <span className="inline-block first-letter:uppercase">{todayLabel}</span> · {summary}
          </p>
        </header>
      </div>

      <PwaInstallBanner labels={dictionary.pwaInstall} />

      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <section aria-labelledby="today-heading" className="min-w-0">
          <h2 id="today-heading" className="text-[17px] font-semibold">{home.todayTitle}</h2>
          {rows.length === 0 ? (
            <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{home.todayEmpty}</p>
          ) : (
            <ul className="-mx-4 mt-1 sm:mx-0">
              {rows.map((lesson) => {
                const meta = [
                  lesson.trainerName,
                  lesson.phase === "inProgress" ? home.inProgress : lesson.phase === "ended" ? home.ended : null,
                  lesson.queueLength > 0 ? fill(home.queueShort, { n: lesson.queueLength }) : null,
                  lesson.pendingCount > 0 ? fill(home.pendingShort, { n: lesson.pendingCount }) : null,
                ].filter(Boolean);
                const needsAttendance = attendanceToMark.some((item) => item.id === lesson.id);
                const occupancyLabel = fill(home.occupancyLabel, { booked: lesson.bookedCount, max: lesson.maxAttendees });
                return (
                  <li
                    key={lesson.id}
                    className={cn(
                      "grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-[var(--rule)] px-4 py-3.5 last:border-b-0 sm:grid-cols-[4.25rem_minmax(0,1fr)_8.5rem_auto] sm:px-0",
                      lesson.phase === "inProgress"
                        ? "my-1 rounded-none border-b-0 bg-[var(--surface)] shadow-[var(--shadow-lift)] sm:-mx-4 sm:rounded-2xl sm:px-4"
                        : ""
                    )}
                  >
                    <p className={cn("leading-none", lesson.phase === "ended" ? "text-[var(--muted-foreground)]" : "")}>
                      <span className="tabular block text-[1.375rem] font-bold sm:text-[1.625rem]">{lesson.timeLabel}</span>
                      <span className="tabular mt-1 block text-[13px] font-medium text-[var(--muted-foreground)]">
                        {lesson.durationMinutes} min
                      </span>
                      <span className="tabular mt-1 block text-[13px] font-semibold text-[var(--foreground)] sm:hidden">
                        {lesson.occupancy}
                        {lesson.pendingCount > 0 ? ` +${lesson.pendingCount}` : ""}
                      </span>
                    </p>
                    <div className="min-w-0">
                      <p className="flex items-start gap-2 text-[17px] font-semibold leading-snug">
                        {lesson.lessonTypeIcon ? (
                          <LessonTypeIcon iconPath={lesson.lessonTypeIcon} colorHex={lesson.lessonTypeColor} size={18} className="mt-[3px]" />
                        ) : null}
                        <span className="min-w-0 break-words">{lesson.title ?? lesson.courseName}</span>
                      </p>
                      <p className="mt-0.5 text-[15px] text-[var(--muted-foreground)]">
                        {meta.map((part, index) => (
                          <span key={index} className={part === home.inProgress ? "font-semibold text-[var(--success-fg)]" : undefined}>
                            {index > 0 ? " · " : null}
                            {part}
                          </span>
                        ))}

                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <SeatStrip booked={lesson.bookedCount} pending={lesson.pendingCount} max={lesson.maxAttendees} label={occupancyLabel} />
                    </div>
                    <div className="justify-self-end">
                      {lesson.canManageLesson ? (
                        <LessonManageButton
                          {...manageProps}
                          lesson={lesson}
                          triggerLabel={needsAttendance ? home.attendeesCta : home.manageCta}
                          opensPeople={needsAttendance}
                        />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="todo-heading" className={cn("min-w-0", todoCount > 0 ? "order-first lg:order-none" : "")}>
          <h2 id="todo-heading" className="flex items-baseline justify-between text-[17px] font-semibold">
            {home.todoTitle}
            {todoCount > 0 ? <span className="tabular text-[15px] font-medium text-[var(--muted-foreground)]">{todoCount}</span> : null}
          </h2>
          {todoCount === 0 ? (
            <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{home.todoEmpty}</p>
          ) : (
            <ul className="mt-2">
              {pendingApprovals.length > 0 ? (
                <TodoItem count={pendingApprovals.length} tone="warning" title={home.todoPendingTitle}>
                  <p className="mt-0.5 text-[15px] text-[var(--muted-foreground)]">
                    {pendingApprovals.slice(0, 3).map((entry, index) => (
                      <span key={`${entry.lessonId}:${entry.traineeId}`} className="block">
                        {entry.trainee.name} · {entry.lesson.title?.trim() || entry.lesson.course?.name || "-"} ·{" "}
                        <span className="tabular">{shortWhenFormat.format(entry.lesson.startsAt)}, {timeFormat.format(entry.lesson.startsAt)}</span>
                        {index === 2 && pendingApprovals.length > 3 ? ` +${pendingApprovals.length - 3}` : null}
                      </span>
                    ))}
                  </p>
                  <DashboardPendingApprovals
                    locale={safeLocale}
                    canGrantOpenAccess={currentUser.role === "ADMIN"}
                    items={pendingApprovals.map((entry) => ({
                      lessonId: entry.lessonId,
                      traineeId: entry.traineeId,
                      traineeName: entry.trainee.name,
                      lessonTitle: entry.lesson.title?.trim() || entry.lesson.course?.name || "-",
                      lessonTypeName: entry.lesson.lessonType?.name ?? "-",
                      startsAtLabel: `${shortWhenFormat.format(entry.lesson.startsAt)}, ${timeFormat.format(entry.lesson.startsAt)}`,
                      approvalNote: staffCertificateNote(
                        entry.trainee.medicalCertificateExpiresAt,
                        entry.lesson.startsAt,
                        safeLocale,
                        getAppDateTimeConfig().timeZone,
                        now
                      ),
                    }))}
                    labels={{
                      openCta: labels.pending.openCta,
                      dialogTitle: labels.pending.dialogTitle,
                      dialogDescription: labels.pending.dialogDescription,
                      empty: labels.pending.empty,
                      approveCta: labels.pending.approveCta,
                      approveAndUnlockCta: labels.pending.approveAndUnlockCta,
                      rejectCta: labels.pending.rejectCta,
                      closeCta: labels.pending.closeCta,
                    }}
                  />
                </TodoItem>
              ) : null}

              {attendanceToMark.map((lesson) => (
                <TodoItem key={`att-${lesson.id}`} count={lesson.attendees.length} tone="info" title={home.todoAttendanceTitle}>
                  <p className="mt-0.5 text-[15px] text-[var(--muted-foreground)]">
                    {fillNodes(home.todoAttendanceBody, {
                      lesson: lesson.title ?? lesson.courseName,
                      time: <span className="tabular">{lesson.timeLabel}</span>,
                      n: <span className="tabular">{lesson.attendees.length}</span>,
                    })}
                  </p>
                  <LessonManageButton {...manageProps} lesson={lesson} triggerLabel={home.todoAttendanceCta} triggerVariant="link" opensPeople />
                </TodoItem>
              ))}

              {atRisk.map((lesson) => (
                <TodoItem key={`risk-${lesson.id}`} icon={<AlertTriangle size={20} />} tone="danger" title={home.todoRiskTitle}>
                  <p className="mt-0.5 text-[15px] text-[var(--muted-foreground)]">
                    {fillNodes(home.todoRiskBody, {
                      lesson: lesson.title ?? lesson.course?.name ?? "-",
                      when: <span className="tabular">{shortWhenFormat.format(lesson.startsAt)}, {timeFormat.format(lesson.startsAt)}</span>,
                      deadline: `${longDayFormat.format(lesson.deadline)} ${safeLocale === "it" ? "alle" : "at"} ${timeFormat.format(lesson.deadline)}`,
                    })}
                  </p>
                  <Link
                    href={`/${safeLocale}/bookings?day=${appDateKey(lesson.startsAt)}`}
                    className={textLinkActionClass}
                  >
                    {home.todoRiskCta}
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                </TodoItem>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-10 grid gap-10 border-t border-[var(--rule)] pt-6 xl:grid-cols-2 [&>*]:min-w-0">
        <DashboardCrowdingChart
          dayLabel={longDayFormat.format(new Date(crowdingStart.getTime() + 12 * 60 * 60 * 1000))}
          contextLabel={(sampleDays.size === 1 ? labels.crowding.contextLabelOne : labels.crowding.contextLabel).replace("{days}", String(sampleDays.size))}
          prevHref={`/${safeLocale}?crowdingDay=${appDateKey(appStartOfDayUtc(cy, cm, cd - 1))}`}
          nextHref={`/${safeLocale}?crowdingDay=${appDateKey(appStartOfDayUtc(cy, cm, cd + 1))}`}
          rows={crowdingRows}
          labels={{
            title: labels.crowding.title,
            description: labels.crowding.description,
            previousDay: labels.crowding.previousDay,
            nextDay: labels.crowding.nextDay,
            empty: labels.crowding.empty,
            avgAttendees: labels.crowding.avgAttendees,
          }}
        />
        {typeChart}
      </div>
    </div>
  );
}
