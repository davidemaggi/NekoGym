import { requireAuth } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getLessonTypeIconOptions, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { prisma } from "@/lib/prisma";

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
  const labels = getDictionary(safeLocale).bookings;

  const iconOptions = await getLessonTypeIconOptions();
  const selectedMonth = parseMonthInput(month);
  const rangeStart = new Date(selectedMonth.year, selectedMonth.month, 1, 0, 0, 0, 0);
  const rangeEnd = new Date(selectedMonth.year, selectedMonth.month + 1, 1, 0, 0, 0, 0);
  const previousMonth = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
  const nextMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 1);

  const lessons = await prisma.lesson.findMany({
    where: {
      status: "SCHEDULED",
      startsAt: { gte: rangeStart, lt: rangeEnd },
    },
    include: {
      course: { select: { id: true, name: true } },
      trainer: { select: { name: true } },
      lessonType: { select: { name: true, iconSvg: true } },
      bookings: {
        where: { traineeId: currentUser.id },
        select: { id: true },
      },
      _count: {
        select: { bookings: true },
      },
      // Keep lesson-level cancellation policy available to the booking UI.
    },
    orderBy: { startsAt: "asc" },
  });

  const items = lessons.map((lesson) => {
    const bookedCount = lesson._count.bookings;
    const availableSeats = Math.max(0, lesson.maxAttendees - bookedCount);
    const isBookedByCurrentUser = lesson.bookings.length > 0;
    const cancellationDeadline = new Date(lesson.startsAt.getTime() - lesson.cancellationWindowHours * 60 * 60 * 1000);
    const canBook =
      currentUser.role === "TRAINEE" && !isBookedByCurrentUser && availableSeats > 0 && lesson.startsAt > new Date();
    const canUnbook = currentUser.role === "TRAINEE" && isBookedByCurrentUser && new Date() <= cancellationDeadline;

    return {
      id: lesson.id,
      startsAt: lesson.startsAt.toISOString(),
      endsAt: lesson.endsAt.toISOString(),
      maxAttendees: lesson.maxAttendees,
      bookedCount,
      availableSeats,
      isBookedByCurrentUser,
      canBook,
      canUnbook,
      occupancy: `${bookedCount}/${lesson.maxAttendees}`,
      isCourseLesson: Boolean(lesson.course?.id),
      courseName: lesson.course?.name ?? "-",
      lessonTypeName: lesson.lessonType?.name ?? null,
      lessonTypeIcon: lesson.lessonType
        ? sanitizeLessonTypeIconPath(lesson.lessonType.iconSvg, iconOptions)
        : null,
      trainerName: lesson.trainer?.name ?? null,
    };
  });

  return (
    <BookingsManager
      locale={locale}
      labels={labels}
      lessons={items}
      month={monthValue(rangeStart)}
      previousMonth={monthValue(previousMonth)}
      nextMonth={monthValue(nextMonth)}
    />
  );
}
