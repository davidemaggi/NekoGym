import type { Prisma, PrismaClient } from "@prisma/client";

import { planWindowForLesson } from "@/lib/booking-rules";

type Db = PrismaClient | Prisma.TransactionClient;

/** How much of a trainee's plan is spent in one period (or in total, for a fixed pack). */
export type PlanUsage = {
  kind: "WEEKLY" | "MONTHLY" | "FIXED";
  used: number;
  limit: number;
};

/**
 * Lessons a weekly/monthly plan counts: every booking (confirmed or pending) on a scheduled,
 * not-deleted lesson inside the window. Booking eligibility uses this same filter.
 */
export function planCountedBookingWhere(traineeId: string, window: { start: Date; end: Date }): Prisma.LessonBookingWhereInput {
  return {
    traineeId,
    lesson: {
      status: "SCHEDULED",
      startsAt: { gte: window.start, lt: window.end },
      deletedAt: null,
    },
  };
}

/**
 * Plan usage for many (trainee, moment) pairs in two queries. `at` picks the period: the
 * week/month that contains it (a lesson's start, or now). Trainees without a plan are omitted.
 */
export async function computePlanUsages(
  db: Db,
  requests: Array<{ key: string; traineeId: string; at: Date }>
): Promise<Map<string, PlanUsage>> {
  const result = new Map<string, PlanUsage>();
  if (requests.length === 0) return result;

  const traineeIds = Array.from(new Set(requests.map((request) => request.traineeId)));
  const [users, settings] = await Promise.all([
    db.user.findMany({
      where: { id: { in: traineeIds }, role: "TRAINEE" },
      select: { id: true, subscriptionType: true, subscriptionLessons: true, subscriptionRemaining: true },
    }),
    db.siteSettings.findUnique({ where: { id: 1 }, select: { weeklyResetWeekday: true } }),
  ]);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const weeklyResetWeekday = settings?.weeklyResetWeekday ?? "MONDAY";

  const windowed: Array<{ key: string; traineeId: string; kind: "WEEKLY" | "MONTHLY"; limit: number; start: Date; end: Date }> = [];
  for (const request of requests) {
    const user = usersById.get(request.traineeId);
    if (!user || user.subscriptionType === "NONE" || !user.subscriptionLessons || user.subscriptionLessons <= 0) continue;

    if (user.subscriptionType === "FIXED") {
      const remaining = user.subscriptionRemaining ?? user.subscriptionLessons;
      result.set(request.key, {
        kind: "FIXED",
        limit: user.subscriptionLessons,
        used: Math.max(0, user.subscriptionLessons - remaining),
      });
      continue;
    }

    const window = planWindowForLesson(request.at, user.subscriptionType, weeklyResetWeekday);
    windowed.push({ key: request.key, traineeId: user.id, kind: user.subscriptionType, limit: user.subscriptionLessons, ...window });
  }

  if (windowed.length === 0) return result;

  const from = new Date(Math.min(...windowed.map((item) => item.start.getTime())));
  const to = new Date(Math.max(...windowed.map((item) => item.end.getTime())));
  const bookings = await db.lessonBooking.findMany({
    where: {
      traineeId: { in: Array.from(new Set(windowed.map((item) => item.traineeId))) },
      lesson: { status: "SCHEDULED", deletedAt: null, startsAt: { gte: from, lt: to } },
    },
    select: { traineeId: true, lesson: { select: { startsAt: true } } },
  });

  for (const item of windowed) {
    const used = bookings.filter(
      (booking) =>
        booking.traineeId === item.traineeId && booking.lesson.startsAt >= item.start && booking.lesson.startsAt < item.end
    ).length;
    result.set(item.key, { kind: item.kind, limit: item.limit, used });
  }

  return result;
}

/** Adds `planUsage` to each person, measured in the period of the lesson they are in. */
export async function withLessonPlanUsage<
  Lesson extends { id: string; startsAt: Date | string },
  P extends { id: string },
>(db: Db, lessons: Lesson[], peopleOf: (lesson: Lesson) => P[]): Promise<Map<string, Map<string, PlanUsage>>> {
  const requests = lessons.flatMap((lesson) =>
    peopleOf(lesson).map((person) => ({ key: `${lesson.id}:${person.id}`, traineeId: person.id, at: new Date(lesson.startsAt) }))
  );
  const usages = await computePlanUsages(db, requests);
  const byLesson = new Map<string, Map<string, PlanUsage>>();
  for (const [key, usage] of usages) {
    const [lessonId, traineeId] = key.split(":");
    const map = byLesson.get(lessonId) ?? new Map<string, PlanUsage>();
    map.set(traineeId, usage);
    byLesson.set(lessonId, map);
  }
  return byLesson;
}
