import type { BookingsView } from "@prisma/client";

import { requireAuth } from "@/lib/authorization";
import { appDateKey, appDateTimeLocalValue, appStartOfDayUtc, formatDayRange, getAppDateTimeConfig } from "@/lib/date-time";
import { getDictionary, isLocale } from "@/lib/i18n";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { isLessonAllowedBySiteSchedule } from "@/lib/lessons";
import { loadMemberPass } from "@/lib/member-pass";
import { type PlanUsage, withLessonPlanUsage } from "@/lib/plan-usage";
import { prisma } from "@/lib/prisma";
import { parseClosedDatesCsv, parseOpenWeekdaysCsv } from "@/lib/site-settings";

import { BookingsManager, type BookingsDay, type BookingsLesson } from "@/app/[locale]/(app)/bookings/bookings-manager";

const BOOKINGS_VIEWS: BookingsView[] = ["DAY", "WEEK", "MONTH"];
const isBookingsView = (value: string | undefined): value is BookingsView =>
  BOOKINGS_VIEWS.includes(value as BookingsView);

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDayKey(value: string | undefined, fallback: string) {
  const match = DAY_KEY_PATTERN.exec(value ?? "") ?? DAY_KEY_PATTERN.exec(fallback)!;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCMonth() !== month - 1) return parseDayKey(undefined, fallback);
  return { year, month, day, weekday: probe.getUTCDay() };
}


export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ day?: string; view?: string }>;
}) {
  const { locale } = await params;
  const { day, view: viewParam } = await searchParams;
  const currentUser = await requireAuth(locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const dictionary = getDictionary(safeLocale);
  const labels = dictionary.bookings;
  const { timeZone } = getAppDateTimeConfig();
  const intlLocale = safeLocale === "it" ? "it-IT" : "en-GB";
  const now = new Date();

  const iconOptions = await getLessonTypeIconOptions();
  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { openWeekdaysCsv: true, closedDatesCsv: true },
  });
  const openWeekdays = parseOpenWeekdaysCsv(siteSettings?.openWeekdaysCsv);
  const closedDates = parseClosedDatesCsv(siteSettings?.closedDatesCsv);

  // An explicit ?view= wins (and is saved by the client); otherwise the user's saved layout.
  const view: BookingsView = isBookingsView(viewParam?.toUpperCase())
    ? (viewParam!.toUpperCase() as BookingsView)
    : ((await prisma.user.findUnique({ where: { id: currentUser.id }, select: { bookingsView: true } }))?.bookingsView ?? "DAY");

  // Day and week views load the week (Monday to Sunday, gym time zone) containing the selected day;
  // the month view loads the whole Monday-first grid around the selected day's month.
  const todayKey = appDateKey(now);
  const selected = parseDayKey(day, todayKey);
  const mondayOffset = (selected.weekday + 6) % 7;
  const firstOfMonthWeekday = new Date(Date.UTC(selected.year, selected.month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(selected.year, selected.month, 0)).getUTCDate();
  const gridLead = (firstOfMonthWeekday + 6) % 7;
  const range =
    view === "MONTH"
      ? { startDay: 1 - gridLead, length: Math.ceil((gridLead + daysInMonth) / 7) * 7, month: selected.month }
      : { startDay: selected.day - mondayOffset, length: 7, month: selected.month };
  const rangeStart = appStartOfDayUtc(selected.year, range.month, range.startDay);
  const rangeEnd = appStartOfDayUtc(selected.year, range.month, range.startDay + range.length);
  const selectedKey = appDateKey(appStartOfDayUtc(selected.year, selected.month, selected.day));
  const previousKey =
    view === "MONTH"
      ? appDateKey(appStartOfDayUtc(selected.year, selected.month - 1, 1))
      : appDateKey(appStartOfDayUtc(selected.year, selected.month, selected.day - 7));
  const nextKey =
    view === "MONTH"
      ? appDateKey(appStartOfDayUtc(selected.year, selected.month + 1, 1))
      : appDateKey(appStartOfDayUtc(selected.year, selected.month, selected.day + 7));

  const timeFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const deadlineFormat = new Intl.DateTimeFormat(intlLocale, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const stampFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, day: "2-digit", month: "2-digit" });
  const longDayFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, weekday: "long", day: "numeric", month: "long" });
  const shortWeekdayFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, weekday: "short" });
  const dayNumberFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, day: "numeric" });

  const lessons = await prisma.lesson.findMany({
    where: {
      status: "SCHEDULED",
      deletedAt: null,
      startsAt: { gte: rangeStart, lt: rangeEnd },
    },
    include: {
      course: { select: { id: true, name: true, description: true } },
      trainer: { select: { id: true, name: true } },
      lessonType: { select: { name: true, iconSvg: true, colorHex: true } },
      bookings: {
        select: {
          traineeId: true,
          status: true,
          attendanceStatus: true,
          trainee: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      waitlistEntries: {
        select: {
          traineeId: true,
          trainee: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { bookings: true, waitlistEntries: true },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  const lessonTypeIds = Array.from(new Set(lessons.map((lesson) => lesson.lessonTypeId).filter((value): value is string => Boolean(value))));
  const accessRows = lessonTypeIds.length > 0
    ? await prisma.userLessonTypeAccess.findMany({
        where: {
          userId: currentUser.id,
          lessonTypeId: { in: lessonTypeIds },
        },
        select: { lessonTypeId: true, mode: true },
      })
    : [];
  const accessByTypeId = new Map(accessRows.map((row) => [row.lessonTypeId, row.mode]));

  function effectiveAccessMode(lessonTypeId: string | null): "DENIED" | "REQUIRES_CONFIRMATION" | "ALLOWED" {
    if (!lessonTypeId) return "ALLOWED";
    if (currentUser.role !== "TRAINEE") return "ALLOWED";
    return accessByTypeId.get(lessonTypeId) ?? "REQUIRES_CONFIRMATION";
  }

  // Plan spent by each person in the lesson's own week/month, only for lessons this staff member manages.
  const planUsage =
    currentUser.role === "TRAINEE"
      ? new Map<string, Map<string, PlanUsage>>()
      : await withLessonPlanUsage(prisma, lessons, (lesson) => [
          ...lesson.bookings.map((booking) => booking.trainee),
          ...lesson.waitlistEntries.map((entry) => entry.trainee),
        ]);
  const usageOf = (lessonId: string, traineeId: string) => planUsage.get(lessonId)?.get(traineeId);
  const items: BookingsLesson[] = lessons.map((lesson) => {
    const bookedCount = lesson._count.bookings;
    const pendingApprovalsCount = lesson.bookings.filter((booking) => booking.status === "PENDING").length;
    const availableSeats = Math.max(0, lesson.maxAttendees - bookedCount);
    const currentUserBooking = lesson.bookings.find((booking) => booking.trainee.id === currentUser.id) ?? null;
    const isBookedByCurrentUser = Boolean(currentUserBooking);
    const isPendingByCurrentUser = currentUserBooking?.status === "PENDING";
    const isQueuedByCurrentUser = lesson.waitlistEntries.some((entry) => entry.traineeId === currentUser.id);
    const accessMode = effectiveAccessMode(lesson.lessonTypeId);
    const isAccessDenied = accessMode === "DENIED";
    const cancellationDeadline = new Date(lesson.startsAt.getTime() - lesson.cancellationWindowHours * 60 * 60 * 1000);
    const hasStarted = lesson.startsAt <= now;
    const canBook = !isAccessDenied && !isBookedByCurrentUser && !isQueuedByCurrentUser && !hasStarted;
    const canUnbook = isBookedByCurrentUser && now <= cancellationDeadline;
    const canManageLesson =
      currentUser.role === "ADMIN" ||
      (currentUser.role === "TRAINER" && lesson.trainer?.id === currentUser.id);
    const canViewWaitlist = currentUser.role === "ADMIN" || currentUser.role === "TRAINER";
    const confirmed = lesson.bookings.filter((booking) => booking.status === "CONFIRMED");

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
      stampDateLabel: stampFormat.format(lesson.startsAt),
      cancelDeadlineLabel: deadlineFormat.format(cancellationDeadline),
      durationMinutes: Math.max(1, Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60000)),
      hasStarted,
      hasEnded: lesson.endsAt <= now,
      maxAttendees: lesson.maxAttendees,
      cancellationWindowHours: lesson.cancellationWindowHours,
      bookedCount,
      availableSeats,
      isBookedByCurrentUser,
      isPendingByCurrentUser,
      isQueuedByCurrentUser,
      isAccessDenied,
      requiresConfirmation: accessMode === "REQUIRES_CONFIRMATION",
      canViewWaitlist,
      queueLength: lesson._count.waitlistEntries,
      pendingApprovalsCount,
      canBook,
      canUnbook,
      canManageLesson,
      occupancy: `${bookedCount}/${lesson.maxAttendees}`,
      isCourseLesson: Boolean(lesson.course?.id),
      courseName: lesson.course?.name ?? "-",
      courseId: lesson.course?.id ?? null,
      courseDescription: lesson.course?.description?.trim() || null,
      lessonTypeName: lesson.lessonType?.name ?? null,
      lessonTypeId: lesson.lessonTypeId ?? "",
      lessonTypeIcon: lesson.lessonType ? sanitizeLessonTypeIconPath(lesson.lessonType.iconSvg, iconOptions) : null,
      lessonTypeColor: lesson.lessonType ? sanitizeLessonTypeColor(lesson.lessonType.colorHex) : null,
      trainerId: lesson.trainer?.id ?? "",
      trainerName: lesson.trainer?.name ?? null,
      attendees: canManageLesson
        ? confirmed.map((booking) => ({
            id: booking.trainee.id,
            name: booking.trainee.name,
            email: booking.trainee.email,
            planUsage: usageOf(lesson.id, booking.trainee.id),
          }))
        : [],
      attendeeAttendance: canManageLesson
        ? Object.fromEntries(confirmed.map((booking) => [booking.trainee.id, booking.attendanceStatus ?? null]))
        : {},
      canManageAttendance: canManageLesson && lesson.endsAt <= now,
      pendingApprovals: canManageLesson
        ? lesson.bookings
            .filter((booking) => booking.status === "PENDING")
            .map((booking) => ({
              id: booking.trainee.id,
              name: booking.trainee.name,
              email: booking.trainee.email,
              planUsage: usageOf(lesson.id, booking.trainee.id),
            }))
        : [],
      waitlist: canManageLesson
        ? lesson.waitlistEntries.map((entry) => ({
            id: entry.trainee.id,
            name: entry.trainee.name,
            email: entry.trainee.email,
            planUsage: usageOf(lesson.id, entry.trainee.id),
          }))
        : [],
    };
  });

  const monthKeyPrefix = selectedKey.slice(0, 7);
  const days: BookingsDay[] = Array.from({ length: range.length }, (_, index) => {
    const start = appStartOfDayUtc(selected.year, range.month, range.startDay + index);
    const key = appDateKey(start);
    const dayLessons = items.filter((lesson) => lesson.dayKey === key);
    // Probe at midday so the weekday check never straddles midnight.
    const midday = new Date(start.getTime() + 12 * 60 * 60 * 1000);
    return {
      key,
      weekdayLabel: shortWeekdayFormat.format(midday).replace(".", ""),
      dayNumberLabel: dayNumberFormat.format(midday),
      longLabel: longDayFormat.format(midday),
      isToday: key === todayKey,
      isPast: key < todayKey,
      isClosed: !isLessonAllowedBySiteSchedule(midday, openWeekdays, closedDates),
      inMonth: key.startsWith(monthKeyPrefix),
      lessonCount: dayLessons.length,
      hasOwnBooking: dayLessons.some((lesson) => lesson.isBookedByCurrentUser),
    };
  });

  const monthTitleFormat = new Intl.DateTimeFormat(intlLocale, { timeZone: "UTC", month: "long", year: "numeric" });
  const periodLabel =
    view === "MONTH"
      ? monthTitleFormat.format(new Date(Date.UTC(selected.year, selected.month - 1, 15)))
      : formatDayRange(
          intlLocale,
          new Date(Date.UTC(selected.year, selected.month - 1, selected.day - mondayOffset)),
          new Date(Date.UTC(selected.year, selected.month - 1, selected.day - mondayOffset + 6)),
          "UTC"
        );

  const { pass, upcoming } = await loadMemberPass({
    userId: currentUser.id,
    role: currentUser.role,
    locale: safeLocale,
    iconOptions,
    now,
    range: { start: rangeStart, end: rangeEnd },
  });

  const canCreateStandaloneLesson = currentUser.role === "ADMIN" || currentUser.role === "TRAINER";
  const trainerCandidates = canCreateStandaloneLesson
    ? currentUser.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "TRAINER"] } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [{ id: currentUser.id, name: currentUser.name }]
    : [];
  const lessonTypeCandidates = canCreateStandaloneLesson
    ? await prisma.lessonType.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];
  const attendeeCandidates = canCreateStandaloneLesson
    ? await prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <BookingsManager
      key={`${view}-${selectedKey}`}
      locale={safeLocale}
      labels={labels}
      lessonCreateLabels={dictionary.lessonsPage}
      lessons={items}
      days={days}
      initialDayKey={selectedKey}
      view={view}
      periodLabel={periodLabel}
      previousKey={previousKey}
      nextKey={nextKey}
      todayKey={todayKey}
      pass={pass}
      upcoming={upcoming}
      canCreateStandaloneLesson={canCreateStandaloneLesson}
      canUpdateTrainer={currentUser.role === "ADMIN"}
      defaultTrainerId={currentUser.role === "TRAINER" ? currentUser.id : undefined}
      trainerCandidates={trainerCandidates}
      lessonTypeCandidates={lessonTypeCandidates}
      attendeeCandidates={attendeeCandidates}
      openWeekdays={openWeekdays}
      closedDates={closedDates}
      isAdmin={currentUser.role === "ADMIN"}
    />
  );
}
