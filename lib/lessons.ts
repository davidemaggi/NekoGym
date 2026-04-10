import type { Prisma, Weekday } from "@prisma/client";
import { DEFAULT_OPEN_WEEKDAYS, parseClosedDatesCsv, parseOpenWeekdaysCsv } from "@/lib/site-settings";
import { enqueueNotificationForUsers } from "@/server/outbox/queue";

const WEEKDAY_INDEX: Record<Weekday, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

type CourseForGeneration = {
  id: string;
  trainerId: string | null;
  lessonTypeId: string | null;
  durationMinutes: number;
  maxAttendees: number;
  bookingAdvanceMonths: number;
  scheduleSlots: Array<{
    weekday: Weekday;
    startTime: string;
  }>;
};

type LessonSeed = {
  startsAt: Date;
  endsAt: Date;
  sourceWeekday: Weekday;
  sourceStartTime: string;
};

export type LessonsReconcileStats = {
  coursesProcessed: number;
  created: number;
  updated: number;
  cancelled: number;
  deleted: number;
};

function parseTime(value: string): { hour: number; minute: number } {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number.parseInt(hourRaw ?? "", 10);
  const minute = Number.parseInt(minuteRaw ?? "", 10);

  return {
    hour: Number.isNaN(hour) ? 0 : hour,
    minute: Number.isNaN(minute) ? 0 : minute,
  };
}

function addMonths(base: Date, months: number): Date {
  const date = new Date(base);
  date.setMonth(date.getMonth() + months);
  return date;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toKey(startsAt: Date): string {
  return startsAt.toISOString();
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatLessonDateForNotification(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function enqueueAutoCancelledLessonNotifications(
  tx: Prisma.TransactionClient,
  input: {
    lessonId: string;
    startsAt: Date;
    courseName: string | null;
    trainerId: string | null;
    reason: string;
  }
) {
  const attendees = await tx.lessonBooking.findMany({
    where: { lessonId: input.lessonId },
    select: {
      trainee: {
        select: {
          id: true,
          telegramChatId: true,
        },
      },
    },
  });

  const targetMap = new Map<string, { id: string; telegramChatId: string | null }>();
  for (const attendee of attendees) {
    targetMap.set(attendee.trainee.id, {
      id: attendee.trainee.id,
      telegramChatId: attendee.trainee.telegramChatId,
    });
  }

  if (input.trainerId) {
    const trainer = await tx.user.findUnique({
      where: { id: input.trainerId },
      select: { id: true, telegramChatId: true },
    });
    if (trainer) {
      targetMap.set(trainer.id, { id: trainer.id, telegramChatId: trainer.telegramChatId });
    }
  }

  const targets = Array.from(targetMap.values());
  if (targets.length === 0) return;

  const subject = "NekoGym - Lezione annullata";
  const body = `La lezione ${input.courseName ?? "-"} del ${formatLessonDateForNotification(input.startsAt)} e stata annullata (${input.reason}).`;

  await enqueueNotificationForUsers(tx, targets, { subject, body });
}

export function isLessonAllowedBySiteSchedule(
  startsAt: Date,
  openWeekdays: Weekday[],
  closedDates: string[]
): boolean {
  const openSet = new Set<Weekday>(openWeekdays.length > 0 ? openWeekdays : DEFAULT_OPEN_WEEKDAYS);
  const closedSet = new Set(closedDates);
  const weekday = Object.keys(WEEKDAY_INDEX).find((day) => WEEKDAY_INDEX[day as Weekday] === startsAt.getDay()) as Weekday;
  if (!openSet.has(weekday)) return false;
  if (closedSet.has(dateKey(startsAt))) return false;
  return true;
}

function parseSiteSchedule(settings: { openWeekdaysCsv: string; closedDatesCsv: string } | null): {
  openWeekdays: Weekday[];
  closedDates: string[];
} {
  if (!settings) {
    return {
      openWeekdays: DEFAULT_OPEN_WEEKDAYS,
      closedDates: [],
    };
  }

  return {
    openWeekdays: parseOpenWeekdaysCsv(settings.openWeekdaysCsv),
    closedDates: parseClosedDatesCsv(settings.closedDatesCsv),
  };
}

export function buildLessonSeeds(course: CourseForGeneration, fromDate = new Date()): LessonSeed[] {
  if (course.scheduleSlots.length === 0) return [];

  const start = startOfDay(fromDate);
  const until = addMonths(start, course.bookingAdvanceMonths);

  const seeds: LessonSeed[] = [];

  for (const slot of course.scheduleSlots) {
    const targetDayIndex = WEEKDAY_INDEX[slot.weekday];
    const { hour, minute } = parseTime(slot.startTime);

    const firstDate = new Date(start);
    const deltaDays = (targetDayIndex - firstDate.getDay() + 7) % 7;
    firstDate.setDate(firstDate.getDate() + deltaDays);
    firstDate.setHours(hour, minute, 0, 0);

    for (let current = new Date(firstDate); current <= until; current.setDate(current.getDate() + 7)) {
      const startsAt = new Date(current);
      if (startsAt <= fromDate) continue;

      const endsAt = new Date(startsAt.getTime() + course.durationMinutes * 60 * 1000);
      seeds.push({
        startsAt,
        endsAt,
        sourceWeekday: slot.weekday,
        sourceStartTime: slot.startTime,
      });
    }
  }

  return seeds.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export async function reconcileFutureLessonsForCourse(
  tx: Prisma.TransactionClient,
  courseId: string
): Promise<Omit<LessonsReconcileStats, "coursesProcessed">> {
  const course = await tx.course.findUnique({
    where: { id: courseId },
    include: { scheduleSlots: true },
  });

  if (!course || course.deletedAt) {
    return { created: 0, updated: 0, cancelled: 0, deleted: 0 };
  }

  const now = new Date();
  const siteSettings = await tx.siteSettings.findUnique({
    where: { id: 1 },
    select: { openWeekdaysCsv: true, closedDatesCsv: true },
  });
  const siteSchedule = parseSiteSchedule(siteSettings);

  const seeds = buildLessonSeeds(course, now).filter((seed) =>
    isLessonAllowedBySiteSchedule(seed.startsAt, siteSchedule.openWeekdays, siteSchedule.closedDates)
  );
  const seedByKey = new Map(seeds.map((seed) => [toKey(seed.startsAt), seed]));

  const existing = await tx.lesson.findMany({
    where: {
      courseId,
      startsAt: { gt: now },
      isGenerated: true,
      deletedAt: null,
    },
    include: {
      _count: { select: { bookings: true } },
    },
  });

  let created = 0;
  let updated = 0;
  let cancelled = 0;
  let deleted = 0;

  for (const lesson of existing) {
    const key = toKey(lesson.startsAt);
    const nextSeed = seedByKey.get(key);

    if (lesson.isCustomized) {
      if (lesson._count.bookings > 0) {
        await tx.lesson.update({
          where: { id: lesson.id },
          data: { status: "CANCELLED", deletedAt: new Date() },
        });
        await enqueueAutoCancelledLessonNotifications(tx, {
          lessonId: lesson.id,
          startsAt: lesson.startsAt,
          courseName: course.name,
          trainerId: lesson.trainerId,
          reason: "lezione personalizzata non piu allineata al corso",
        });
        // Avoid creating a duplicate for same course+startsAt when customized lesson is kept as cancelled.
        seedByKey.delete(key);
        cancelled += 1;
      } else {
        await tx.lesson.update({
          where: { id: lesson.id },
          data: { status: "CANCELLED", deletedAt: new Date() },
        });
        // Keep seed key so a fresh generated lesson can be recreated.
        deleted += 1;
      }
      continue;
    }

    if (!nextSeed) {
      if (lesson._count.bookings > 0) {
        await tx.lesson.update({
          where: { id: lesson.id },
          data: { status: "CANCELLED", deletedAt: new Date() },
        });
        await enqueueAutoCancelledLessonNotifications(tx, {
          lessonId: lesson.id,
          startsAt: lesson.startsAt,
          courseName: course.name,
          trainerId: lesson.trainerId,
          reason: "aggiornamento corso",
        });
        cancelled += 1;
      } else {
        await tx.lesson.update({
          where: { id: lesson.id },
          data: { status: "CANCELLED", deletedAt: new Date() },
        });
        deleted += 1;
      }
      continue;
    }

    await tx.lesson.update({
      where: { id: lesson.id },
      data: {
        endsAt: nextSeed.endsAt,
        sourceWeekday: nextSeed.sourceWeekday,
        sourceStartTime: nextSeed.sourceStartTime,
        trainerId: course.trainerId,
        lessonTypeId: course.lessonTypeId,
        maxAttendees: course.maxAttendees,
        cancellationWindowHours: course.cancellationWindowHours,
        status: "SCHEDULED",
        isCustomized: false,
      },
    });
    updated += 1;

    seedByKey.delete(key);
  }

  for (const seed of seedByKey.values()) {
    await tx.lesson.create({
      data: {
        courseId: course.id,
        lessonTypeId: course.lessonTypeId,
        trainerId: course.trainerId,
        startsAt: seed.startsAt,
        endsAt: seed.endsAt,
        sourceWeekday: seed.sourceWeekday,
        sourceStartTime: seed.sourceStartTime,
        maxAttendees: course.maxAttendees,
        cancellationWindowHours: course.cancellationWindowHours,
        status: "SCHEDULED",
        isGenerated: true,
        isCustomized: false,
      },
    });
    created += 1;
  }

  return { created, updated, cancelled, deleted };
}

export async function reconcileFutureLessonsForAllCourses(
  tx: Prisma.TransactionClient
): Promise<LessonsReconcileStats> {
  const courses = await tx.course.findMany({ where: { deletedAt: null }, select: { id: true } });
  const totals: LessonsReconcileStats = {
    coursesProcessed: courses.length,
    created: 0,
    updated: 0,
    cancelled: 0,
    deleted: 0,
  };

  for (const course of courses) {
    const stats = await reconcileFutureLessonsForCourse(tx, course.id);
    totals.created += stats.created;
    totals.updated += stats.updated;
    totals.cancelled += stats.cancelled;
    totals.deleted += stats.deleted;
  }

  return totals;
}

export async function reconcileFutureLessonsForSiteSchedule(tx: Prisma.TransactionClient) {
  const siteSettings = await tx.siteSettings.findUnique({
    where: { id: 1 },
    select: { openWeekdaysCsv: true, closedDatesCsv: true },
  });
  const siteSchedule = parseSiteSchedule(siteSettings);
  const now = new Date();

  const lessons = await tx.lesson.findMany({
    where: {
      startsAt: { gt: now },
      status: "SCHEDULED",
      deletedAt: null,
    },
    include: {
      course: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
  });

  for (const lesson of lessons) {
    const allowed = isLessonAllowedBySiteSchedule(lesson.startsAt, siteSchedule.openWeekdays, siteSchedule.closedDates);
    if (allowed) continue;

    if (lesson._count.bookings > 0) {
      await tx.lesson.update({
        where: { id: lesson.id },
        data: { status: "CANCELLED", deletedAt: new Date() },
      });
      await enqueueAutoCancelledLessonNotifications(tx, {
        lessonId: lesson.id,
        startsAt: lesson.startsAt,
        courseName: lesson.course?.name ?? null,
        trainerId: lesson.trainerId,
        reason: "chiusura palestra",
      });
    } else {
      await tx.lesson.update({
        where: { id: lesson.id },
        data: { status: "CANCELLED", deletedAt: new Date() },
      });
    }
  }
}

export async function cancelFutureLessonsForDeletedCourse(
  tx: Prisma.TransactionClient,
  courseId: string,
  input: { cancelBookedLessons: boolean }
) {
  const now = new Date();

  const lessons = await tx.lesson.findMany({
    where: {
      courseId,
      startsAt: { gt: now },
      deletedAt: null,
    },
    include: {
      course: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
  });

  for (const lesson of lessons) {
    if (lesson._count.bookings > 0) {
      if (!input.cancelBookedLessons) {
        continue;
      }

      await tx.lesson.update({
        where: { id: lesson.id },
        data: { status: "CANCELLED", deletedAt: new Date() },
      });
      await enqueueAutoCancelledLessonNotifications(tx, {
        lessonId: lesson.id,
        startsAt: lesson.startsAt,
        courseName: lesson.course?.name ?? null,
        trainerId: lesson.trainerId,
        reason: "corso eliminato",
      });
    } else {
      await tx.lesson.update({
        where: { id: lesson.id },
        data: { status: "CANCELLED", deletedAt: new Date() },
      });
    }
  }
}

export async function cancelLessonsEnteringNoticeWindow(tx: Prisma.TransactionClient): Promise<number> {
  const now = new Date();
  const lessons = await tx.lesson.findMany({
    where: {
      status: "SCHEDULED",
      deletedAt: null,
      startsAt: { gt: now },
    },
    include: {
      course: { select: { name: true } },
      trainer: { select: { id: true, telegramChatId: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  let cancelled = 0;

  for (const lesson of lessons) {
    const msUntilStart = lesson.startsAt.getTime() - now.getTime();
    const noticeMs = lesson.cancellationWindowHours * 60 * 60 * 1000;
    if (msUntilStart > noticeMs) {
      continue;
    }

    await tx.lesson.update({
      where: { id: lesson.id },
      data: { status: "CANCELLED", deletedAt: new Date() },
    });

    if (lesson.trainer) {
      await enqueueNotificationForUsers(
        tx,
        [{ id: lesson.trainer.id, telegramChatId: lesson.trainer.telegramChatId }],
        {
          subject: "NekoGym - Lezione annullata automaticamente",
          body: `La lezione ${lesson.course?.name ?? "-"} del ${formatLessonDateForNotification(lesson.startsAt)} e stata annullata automaticamente per limite preavviso.`,
        }
      );
    }

    cancelled += 1;
  }

  return cancelled;
}

