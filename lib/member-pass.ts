import type { UserRole } from "@prisma/client";

import { isTrialActive, planWindowForLesson } from "@/lib/booking-rules";
import { appDateKey, getAppDateTimeConfig } from "@/lib/date-time";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { prisma } from "@/lib/prisma";
import type { BookingPass } from "@/components/bookings/pass-card";

export type UpcomingBooking = {
  id: string;
  dayKey: string;
  title: string;
  whenLabel: string;
  dateLabel: string;
  timeLabel: string;
  stampDateLabel: string;
  trainerName: string | null;
  isPending: boolean;
  lessonTypeIcon: string | null;
  lessonTypeColor: string | null;
};

/** The member's season pass (trainees only) and their upcoming bookings, labelled in the gym time zone. */
export async function loadMemberPass(input: {
  userId: string;
  role: UserRole;
  locale: string;
  iconOptions: string[];
  now?: Date;
}): Promise<{ pass: BookingPass | null; upcoming: UpcomingBooking[] }> {
  const now = input.now ?? new Date();
  const { timeZone } = getAppDateTimeConfig();
  const intlLocale = input.locale === "it" ? "it-IT" : "en-GB";
  const dateFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, day: "2-digit", month: "2-digit", year: "numeric" });
  const whenFormat = new Intl.DateTimeFormat(intlLocale, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const timeFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const dayFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, weekday: "long", day: "numeric", month: "long" });
  const stampFormat = new Intl.DateTimeFormat(intlLocale, { timeZone, day: "2-digit", month: "2-digit" });

  const [fullUser, settings, bookings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        membershipStatus: true,
        trialEndsAt: true,
        subscriptionType: true,
        subscriptionLessons: true,
        subscriptionRemaining: true,
        subscriptionEndsAt: true,
      },
    }),
    prisma.siteSettings.findUnique({ where: { id: 1 }, select: { weeklyResetWeekday: true } }),
    prisma.lessonBooking.findMany({
      where: {
        traineeId: input.userId,
        lesson: { status: "SCHEDULED", deletedAt: null, startsAt: { gt: now } },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            course: { select: { name: true } },
            trainer: { select: { name: true } },
            lessonType: { select: { iconSvg: true, colorHex: true } },
          },
        },
      },
      orderBy: { lesson: { startsAt: "asc" } },
    }),
  ]);

  const activeBookings = bookings.length;
  let pass: BookingPass | null = null;

  if (input.role === "TRAINEE" && fullUser) {
    const validUntilLabel = fullUser.subscriptionEndsAt ? dateFormat.format(fullUser.subscriptionEndsAt) : null;
    const total = fullUser.subscriptionLessons ?? 0;

    if (fullUser.membershipStatus !== "ACTIVE") {
      pass =
        isTrialActive(fullUser.trialEndsAt, now) && fullUser.trialEndsAt
          ? { kind: "trial", untilLabel: dateFormat.format(fullUser.trialEndsAt), activeBookings }
          : { kind: "inactive", activeBookings };
    } else if (fullUser.subscriptionType === "FIXED") {
      const remaining = Math.max(0, fullUser.subscriptionRemaining ?? total);
      pass = { kind: "fixed", total, used: Math.max(0, total - remaining), remaining, validUntilLabel, activeBookings };
    } else if (fullUser.subscriptionType === "WEEKLY" || fullUser.subscriptionType === "MONTHLY") {
      const window = planWindowForLesson(now, fullUser.subscriptionType, settings?.weeklyResetWeekday ?? "MONDAY");
      const used = await prisma.lessonBooking.count({
        where: {
          traineeId: input.userId,
          lesson: { status: "SCHEDULED", deletedAt: null, startsAt: { gte: window.start, lt: window.end } },
        },
      });
      pass = {
        kind: fullUser.subscriptionType === "WEEKLY" ? "weekly" : "monthly",
        total,
        used: Math.min(used, total),
        remaining: Math.max(0, total - used),
        validUntilLabel,
        activeBookings,
      };
    } else {
      pass = { kind: "open", validUntilLabel, activeBookings };
    }
  }

  const upcoming = bookings.slice(0, 5).map((booking) => ({
    id: booking.lesson.id,
    dayKey: appDateKey(booking.lesson.startsAt),
    title: booking.lesson.title ?? booking.lesson.course?.name ?? "-",
    whenLabel: whenFormat.format(booking.lesson.startsAt),
    dateLabel: dayFormat.format(booking.lesson.startsAt),
    timeLabel: timeFormat.format(booking.lesson.startsAt),
    stampDateLabel: stampFormat.format(booking.lesson.startsAt),
    trainerName: booking.lesson.trainer?.name ?? null,
    isPending: booking.status === "PENDING",
    lessonTypeIcon: booking.lesson.lessonType
      ? sanitizeLessonTypeIconPath(booking.lesson.lessonType.iconSvg, input.iconOptions)
      : null,
    lessonTypeColor: booking.lesson.lessonType ? sanitizeLessonTypeColor(booking.lesson.lessonType.colorHex) : null,
  }));

  return { pass, upcoming };
}
