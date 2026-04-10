import { requireAuth } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { prisma } from "@/lib/prisma";
import { parseClosedDatesCsv, parseOpenWeekdaysCsv } from "@/lib/site-settings";

import { BookingsManager } from "@/app/[locale]/(app)/bookings/bookings-manager";

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

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const { month } = await searchParams;
  const currentUser = await requireAuth(locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const dictionary = getDictionary(safeLocale);
  const labels = dictionary.bookings;

  const iconOptions = await getLessonTypeIconOptions();
  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { openWeekdaysCsv: true, closedDatesCsv: true },
  });
  const openWeekdays = parseOpenWeekdaysCsv(siteSettings?.openWeekdaysCsv);
  const closedDates = parseClosedDatesCsv(siteSettings?.closedDatesCsv);
  const selectedMonth = parseMonthInput(month);
  const rangeStart = new Date(selectedMonth.year, selectedMonth.month, 1, 0, 0, 0, 0);
  const rangeEnd = new Date(selectedMonth.year, selectedMonth.month + 1, 1, 0, 0, 0, 0);
  const previousMonth = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
  const nextMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 1);

  const lessons = await prisma.lesson.findMany({
    where: {
      status: "SCHEDULED",
      deletedAt: null,
      startsAt: { gte: rangeStart, lt: rangeEnd },
    },
    include: {
      course: { select: { id: true, name: true } },
      trainer: { select: { id: true, name: true } },
      lessonType: { select: { name: true, iconSvg: true, colorHex: true } },
      bookings: {
        select: {
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
      // Keep lesson-level cancellation policy available to the booking UI.
    },
    orderBy: { startsAt: "asc" },
  });

  const items = lessons.map((lesson) => {
    const bookedCount = lesson._count.bookings;
    const availableSeats = Math.max(0, lesson.maxAttendees - bookedCount);
    const isBookedByCurrentUser = lesson.bookings.some((booking) => booking.trainee.id === currentUser.id);
    const isQueuedByCurrentUser = lesson.waitlistEntries.some((entry) => entry.traineeId === currentUser.id);
    const cancellationDeadline = new Date(lesson.startsAt.getTime() - lesson.cancellationWindowHours * 60 * 60 * 1000);
    const canBook = !isBookedByCurrentUser && !isQueuedByCurrentUser && lesson.startsAt > new Date();
    const canUnbook = isBookedByCurrentUser && new Date() <= cancellationDeadline;
    const canManageLesson =
      currentUser.role === "ADMIN" ||
      (currentUser.role === "TRAINER" && lesson.trainer?.id === currentUser.id);
    const canViewWaitlist = currentUser.role === "ADMIN" || currentUser.role === "TRAINER";

    return {
      id: lesson.id,
      title: lesson.title ?? null,
      description: lesson.description ?? null,
      startsAt: lesson.startsAt.toISOString(),
      endsAt: lesson.endsAt.toISOString(),
      maxAttendees: lesson.maxAttendees,
      cancellationWindowHours: lesson.cancellationWindowHours,
      bookedCount,
      availableSeats,
      isBookedByCurrentUser,
      isQueuedByCurrentUser,
      canViewWaitlist,
      queueLength: lesson._count.waitlistEntries,
      canBook,
      canUnbook,
      canManageLesson,
      occupancy: `${bookedCount}/${lesson.maxAttendees}`,
      isCourseLesson: Boolean(lesson.course?.id),
      courseName: lesson.course?.name ?? "-",
      lessonTypeName: lesson.lessonType?.name ?? null,
      lessonTypeId: lesson.lessonTypeId ?? "",
      lessonTypeIcon: lesson.lessonType
        ? sanitizeLessonTypeIconPath(lesson.lessonType.iconSvg, iconOptions)
        : null,
      lessonTypeColor: lesson.lessonType ? sanitizeLessonTypeColor(lesson.lessonType.colorHex) : null,
      trainerId: lesson.trainer?.id ?? "",
      trainerName: lesson.trainer?.name ?? null,
      attendees: canManageLesson
        ? lesson.bookings.map((booking) => ({
            id: booking.trainee.id,
            name: booking.trainee.name,
            email: booking.trainee.email,
          }))
        : [],
      waitlist: canManageLesson
        ? lesson.waitlistEntries.map((entry) => ({
            id: entry.trainee.id,
            name: entry.trainee.name,
            email: entry.trainee.email,
          }))
        : [],
    };
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
      locale={locale}
      labels={labels}
      lessonCreateLabels={dictionary.lessonsPage}
      lessons={items}
      month={monthValue(rangeStart)}
      previousMonth={monthValue(previousMonth)}
      nextMonth={monthValue(nextMonth)}
      canCreateStandaloneLesson={canCreateStandaloneLesson}
      canUpdateTrainer={currentUser.role === "ADMIN"}
      defaultTrainerId={currentUser.role === "TRAINER" ? currentUser.id : undefined}
      trainerCandidates={trainerCandidates}
      lessonTypeCandidates={lessonTypeCandidates}
      attendeeCandidates={attendeeCandidates}
      openWeekdays={openWeekdays}
      closedDates={closedDates}
    />
  );
}
