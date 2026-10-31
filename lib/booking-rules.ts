import type { LessonBookingStatus, LessonTypeAccessMode, Prisma, Weekday } from "@prisma/client";

import { appStartOfDayUtc, getAppDateParts, getAppDateTimeConfig } from "@/lib/date-time";
import { planCountedBookingWhere } from "@/lib/plan-usage";
import { enqueueNotificationForUsers } from "@/server/outbox/queue";

// Shared booking rules: the same checks apply to a trainee booking a lesson
// and to a waitlist entry being promoted when a seat frees up.

const WEEKDAY_INDEX: Record<Weekday, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

type NotificationTarget = { id: string; telegramChatId: string | null };

export type BookingIneligibleReason =
  | "subscriptionExpired"
  | "membershipDenied"
  | "lessonTypeDenied"
  | "sameCourseDay"
  | "planDenied";

export type BookingEligibility =
  | { ok: true; accessMode: LessonTypeAccessMode }
  | { ok: false; reason: BookingIneligibleReason };

type LessonForEligibility = {
  id: string;
  courseId: string | null;
  lessonTypeId: string | null;
  startsAt: Date;
};

export function isTrialActive(trialEndsAt: Date | null, now = new Date()): boolean {
  if (!trialEndsAt) return false;
  return trialEndsAt >= now;
}

/** Start/end of the app-time-zone day containing `instant`. */
export function appDayRange(instant: Date): { start: Date; end: Date } {
  const { year, month, day } = getAppDateParts(instant);
  return { start: appStartOfDayUtc(year, month, day), end: appStartOfDayUtc(year, month, day + 1) };
}

/**
 * Plan window containing the lesson: the week starts on the site `weeklyResetWeekday`,
 * the month on day 1. Both are computed in the app time zone.
 */
export function planWindowForLesson(
  startsAt: Date,
  type: "WEEKLY" | "MONTHLY",
  weeklyResetWeekday: Weekday
): { start: Date; end: Date } {
  const { year, month, day, weekday } = getAppDateParts(startsAt);

  if (type === "WEEKLY") {
    const diffToReset = (weekday - WEEKDAY_INDEX[weeklyResetWeekday] + 7) % 7;
    return {
      start: appStartOfDayUtc(year, month, day - diffToReset),
      end: appStartOfDayUtc(year, month, day - diffToReset + 7),
    };
  }

  return { start: appStartOfDayUtc(year, month, 1), end: appStartOfDayUtc(year, month + 1, 1) };
}

export function formatLessonDateTime(value: Date, locale: string): string {
  const { timeZone } = getAppDateTimeConfig();
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(value);
}

export async function getEffectiveLessonTypeAccessMode(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  role: "ADMIN" | "TRAINER" | "TRAINEE";
  lessonTypeId: string | null;
}): Promise<LessonTypeAccessMode> {
  if (!input.lessonTypeId) return "ALLOWED";
  if (input.role !== "TRAINEE") return "ALLOWED";

  const row = await input.tx.userLessonTypeAccess.findUnique({
    where: {
      userId_lessonTypeId: {
        userId: input.userId,
        lessonTypeId: input.lessonTypeId,
      },
    },
    select: { mode: true },
  });

  return row?.mode ?? "REQUIRES_CONFIRMATION";
}

/**
 * Membership/trial, lesson-type access, same-course-same-day and plan limits.
 * Does not check seats, duplicates or lesson status: callers handle those.
 */
export async function evaluateBookingEligibility(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  lesson: LessonForEligibility;
  now?: Date;
}): Promise<BookingEligibility> {
  const { tx, lesson } = input;
  const now = input.now ?? new Date();

  const user = await tx.user.findUnique({
    where: { id: input.userId },
    select: {
      role: true,
      membershipStatus: true,
      trialEndsAt: true,
      subscriptionType: true,
      subscriptionLessons: true,
      subscriptionRemaining: true,
      subscriptionEndsAt: true,
    },
  });
  if (!user) return { ok: false, reason: "membershipDenied" };

  if (user.subscriptionEndsAt && user.subscriptionEndsAt < now) {
    return { ok: false, reason: "subscriptionExpired" };
  }

  if (user.role === "TRAINEE") {
    const membershipAllowed = user.membershipStatus === "ACTIVE" || isTrialActive(user.trialEndsAt, now);
    if (!membershipAllowed) return { ok: false, reason: "membershipDenied" };
  }

  const accessMode = await getEffectiveLessonTypeAccessMode({
    tx,
    userId: input.userId,
    role: user.role,
    lessonTypeId: lesson.lessonTypeId,
  });
  if (accessMode === "DENIED") return { ok: false, reason: "lessonTypeDenied" };

  if (lesson.courseId) {
    const day = appDayRange(lesson.startsAt);
    const sameCourseDayBooking = await tx.lessonBooking.findFirst({
      where: {
        traineeId: input.userId,
        lessonId: { not: lesson.id },
        lesson: {
          courseId: lesson.courseId,
          startsAt: { gte: day.start, lt: day.end },
          status: "SCHEDULED",
          deletedAt: null,
        },
      },
      select: { id: true },
    });
    if (sameCourseDayBooking) return { ok: false, reason: "sameCourseDay" };
  }

  if (user.role === "TRAINEE" && user.membershipStatus === "ACTIVE" && user.subscriptionType !== "NONE") {
    if (user.subscriptionType === "FIXED") {
      if (user.subscriptionRemaining !== null && user.subscriptionRemaining <= 0) {
        return { ok: false, reason: "planDenied" };
      }
    }

    if (user.subscriptionType === "WEEKLY" || user.subscriptionType === "MONTHLY") {
      if (user.subscriptionLessons === null || user.subscriptionLessons <= 0) {
        return { ok: false, reason: "planDenied" };
      }

      const settings = await tx.siteSettings.findUnique({ where: { id: 1 }, select: { weeklyResetWeekday: true } });
      const window = planWindowForLesson(lesson.startsAt, user.subscriptionType, settings?.weeklyResetWeekday ?? "MONDAY");
      // Same counting rule the staff sees as "used / limit" (lib/plan-usage.ts).
      const bookingsInWindow = await tx.lessonBooking.count({ where: planCountedBookingWhere(input.userId, window) });

      if (bookingsInWindow >= user.subscriptionLessons) return { ok: false, reason: "planDenied" };
    }
  }

  return { ok: true, accessMode };
}

export async function consumeFixedPlanUnits(tx: Prisma.TransactionClient, traineeId: string, units = 1) {
  if (units <= 0) return;

  const trainee = await tx.user.findUnique({
    where: { id: traineeId },
    select: { role: true, membershipStatus: true, subscriptionType: true, subscriptionRemaining: true },
  });

  if (
    !trainee ||
    trainee.role !== "TRAINEE" ||
    trainee.membershipStatus !== "ACTIVE" ||
    trainee.subscriptionType !== "FIXED" ||
    trainee.subscriptionRemaining === null
  ) {
    return;
  }

  await tx.user.update({
    where: { id: traineeId },
    data: { subscriptionRemaining: Math.max(0, trainee.subscriptionRemaining - units) },
  });
}

/** Gives back one FIXED-plan lesson. Only CONFIRMED bookings ever consumed one. */
export async function refundFixedPlanUnit(
  tx: Prisma.TransactionClient,
  traineeId: string,
  bookingStatus: LessonBookingStatus
) {
  if (bookingStatus !== "CONFIRMED") return;

  const trainee = await tx.user.findUnique({
    where: { id: traineeId },
    select: { role: true, membershipStatus: true, subscriptionType: true, subscriptionRemaining: true, subscriptionLessons: true },
  });

  if (
    !trainee ||
    trainee.role !== "TRAINEE" ||
    trainee.membershipStatus !== "ACTIVE" ||
    trainee.subscriptionType !== "FIXED"
  ) {
    return;
  }

  const currentRemaining = trainee.subscriptionRemaining ?? 0;
  const maxLessons = trainee.subscriptionLessons ?? currentRemaining + 1;
  await tx.user.update({
    where: { id: traineeId },
    data: { subscriptionRemaining: Math.min(maxLessons, currentRemaining + 1) },
  });
}

export async function getLessonStaffTargets(tx: Prisma.TransactionClient, lessonId: string): Promise<NotificationTarget[]> {
  const lesson = await tx.lesson.findUnique({
    where: { id: lessonId },
    select: { trainer: { select: { id: true, telegramChatId: true } } },
  });
  const admins = await tx.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, telegramChatId: true },
  });
  const targets = new Map<string, NotificationTarget>();
  for (const admin of admins) targets.set(admin.id, admin);
  if (lesson?.trainer) targets.set(lesson.trainer.id, lesson.trainer);
  return Array.from(targets.values());
}

export type WaitlistPromotion = {
  id: string;
  name: string;
  telegramChatId: string | null;
  status: LessonBookingStatus;
};

/**
 * Gives the free seat to the oldest waitlist entry that passes the booking rules.
 * Ineligible entries stay in the queue (they may become eligible later, e.g. after a plan renewal).
 * Lesson types requiring confirmation produce a PENDING booking, exactly like a normal booking.
 */
export async function promoteNextEligibleWaitlistEntry(input: {
  tx: Prisma.TransactionClient;
  lessonId: string;
  confirmedById: string;
}): Promise<WaitlistPromotion | null> {
  const { tx, lessonId } = input;
  const now = new Date();

  const lesson = await tx.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true, lessonTypeId: true, startsAt: true, status: true, deletedAt: true },
  });
  if (!lesson || lesson.deletedAt || lesson.status !== "SCHEDULED" || lesson.startsAt <= now) return null;

  const queue = await tx.lessonWaitlistEntry.findMany({
    where: { lessonId },
    orderBy: { createdAt: "asc" },
    include: { trainee: { select: { id: true, name: true, telegramChatId: true } } },
  });

  for (const entry of queue) {
    const existingBooking = await tx.lessonBooking.findUnique({
      where: { lessonId_traineeId: { lessonId, traineeId: entry.traineeId } },
      select: { id: true },
    });
    if (existingBooking) {
      await tx.lessonWaitlistEntry.delete({ where: { id: entry.id } });
      continue;
    }

    const eligibility = await evaluateBookingEligibility({ tx, userId: entry.traineeId, lesson, now });
    if (!eligibility.ok) continue;

    const status: LessonBookingStatus = eligibility.accessMode === "REQUIRES_CONFIRMATION" ? "PENDING" : "CONFIRMED";
    await tx.lessonBooking.create({
      data: {
        lessonId,
        traineeId: entry.traineeId,
        status,
        confirmedAt: status === "CONFIRMED" ? now : null,
        confirmedById: status === "CONFIRMED" ? input.confirmedById : null,
      },
    });
    await tx.lessonWaitlistEntry.delete({ where: { id: entry.id } });

    if (status === "CONFIRMED") {
      await consumeFixedPlanUnits(tx, entry.traineeId, 1);
    }

    return { id: entry.trainee.id, name: entry.trainee.name, telegramChatId: entry.trainee.telegramChatId, status };
  }

  return null;
}

/** Notifies the promoted trainee and the lesson staff about a waitlist promotion. */
export async function notifyWaitlistPromotion(input: {
  tx: Prisma.TransactionClient;
  locale: string;
  lessonId: string;
  promoted: WaitlistPromotion;
  leavingName: string;
  courseName: string | null;
  startsAt: Date;
}) {
  const isIt = input.locale === "it";
  const courseName = input.courseName ?? "-";
  const when = formatLessonDateTime(input.startsAt, input.locale);
  const pending = input.promoted.status === "PENDING";

  await enqueueNotificationForUsers(
    input.tx,
    [{ id: input.promoted.id, telegramChatId: input.promoted.telegramChatId }],
    pending
      ? {
          subject: isIt ? "Posto liberato: richiesta in attesa" : "Seat freed: request pending",
          body: isIt
            ? `Si e liberato un posto per la lezione ${courseName} del ${when}. La tua richiesta e ora in attesa di conferma da trainer/admin.`
            : `A seat is now available for lesson ${courseName} on ${when}. Your request is now awaiting trainer/admin confirmation.`,
        }
      : {
          subject: isIt ? "Posto confermato dalla coda" : "Seat confirmed from waitlist",
          body: isIt
            ? `Si e liberato un posto: la tua iscrizione alla lezione ${courseName} del ${when} e ora confermata.`
            : `A seat is now available: your booking for lesson ${courseName} on ${when} is now confirmed.`,
        }
  );

  const staffTargets = await getLessonStaffTargets(input.tx, input.lessonId);
  if (staffTargets.length === 0) return;

  await enqueueNotificationForUsers(
    input.tx,
    staffTargets,
    pending
      ? {
          subject: isIt ? "Nuova richiesta iscrizione da confermare" : "New booking request awaiting confirmation",
          body: isIt
            ? `${input.leavingName} ha lasciato la lezione ${courseName} del ${when}. ${input.promoted.name} e salito dalla coda ed e in attesa di conferma.`
            : `${input.leavingName} left lesson ${courseName} on ${when}. ${input.promoted.name} moved up from the waitlist and is awaiting confirmation.`,
        }
      : {
          subject: isIt ? "Sostituzione automatica in lezione" : "Automatic replacement in lesson",
          body: isIt
            ? `${input.leavingName} ha lasciato la lezione ${courseName} del ${when}. ${input.promoted.name} e stato confermato automaticamente dalla coda e ha preso il posto.`
            : `${input.leavingName} left lesson ${courseName} on ${when}. ${input.promoted.name} was automatically confirmed from waitlist and took the seat.`,
        }
  );
}

/**
 * The gym cancelled a lesson (course change, closure, staff cancellation): every CONFIRMED booking
 * gets its FIXED-plan lesson back. Bookings are kept on the cancelled lesson for history.
 * Returns how many bookings were refunded.
 */
export async function refundFixedPlanUnitsForCancelledLesson(tx: Prisma.TransactionClient, lessonId: string): Promise<number> {
  const bookings = await tx.lessonBooking.findMany({
    where: { lessonId, status: "CONFIRMED" },
    select: { traineeId: true },
  });
  for (const booking of bookings) {
    await refundFixedPlanUnit(tx, booking.traineeId, "CONFIRMED");
  }
  return bookings.length;
}

/** Inverse of the refund above, used when a cancelled future lesson is restored with its bookings. */
export async function reconsumeFixedPlanUnitsForRestoredLesson(tx: Prisma.TransactionClient, lessonId: string) {
  const bookings = await tx.lessonBooking.findMany({
    where: { lessonId, status: "CONFIRMED" },
    select: { traineeId: true },
  });
  for (const booking of bookings) {
    await consumeFixedPlanUnits(tx, booking.traineeId, 1);
  }
}
