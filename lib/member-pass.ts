import type { UserRole } from "@prisma/client";

import { isTrialActive, planWindowForLesson } from "@/lib/booking-rules";
import { appDateKey, formatDayRange, getAppDateTimeConfig } from "@/lib/date-time";
import { planCountedBookingWhere } from "@/lib/plan-usage";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { prisma } from "@/lib/prisma";
import type { BookingPass, PassPeriod } from "@/components/bookings/pass-card";

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
  /** Days the page shows: WEEKLY/MONTHLY passes then also report every plan period overlapping them. */
  range?: { start: Date; end: Date };
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
      const type = fullUser.subscriptionType;
      const resetWeekday = settings?.weeklyResetWeekday ?? "MONDAY";
      const current = planWindowForLesson(now, type, resetWeekday);

      // The current period plus every period overlapping the shown days, counted with the booking rules' own filter.
      const windows = [current];
      if (input.range) {
        for (let probe = planWindowForLesson(input.range.start, type, resetWeekday); probe.start < input.range.end; ) {
          if (probe.start.getTime() !== current.start.getTime()) windows.push(probe);
          probe = planWindowForLesson(probe.end, type, resetWeekday);
        }
      }
      const spanStart = new Date(Math.min(...windows.map((window) => window.start.getTime())));
      const spanEnd = new Date(Math.max(...windows.map((window) => window.end.getTime())));
      const counted = await prisma.lessonBooking.findMany({
        where: planCountedBookingWhere(input.userId, { start: spanStart, end: spanEnd }),
        select: { lesson: { select: { startsAt: true } } },
      });
      const usedIn = (window: { start: Date; end: Date }) =>
        counted.filter(({ lesson }) => lesson.startsAt >= window.start && lesson.startsAt < window.end).length;

      const monthLabel = new Intl.DateTimeFormat(intlLocale, { timeZone, month: "long" });
      const monthYearLabel = new Intl.DateTimeFormat(intlLocale, { timeZone, month: "long", year: "numeric" });
      const nowYear = appDateKey(now).slice(0, 4);
      const periods: PassPeriod[] = windows
        .map((window) => {
          const used = usedIn(window);
          const lastDay = new Date(window.end.getTime() - 12 * 60 * 60 * 1000);
          return {
            startKey: appDateKey(window.start),
            endKey: appDateKey(window.end),
            used: Math.min(used, total),
            remaining: Math.max(0, total - used),
            isCurrent: window === current,
            label:
              type === "WEEKLY"
                ? formatDayRange(intlLocale, window.start, lastDay, timeZone)
                : (appDateKey(window.start).slice(0, 4) === nowYear ? monthLabel : monthYearLabel).format(window.start),
          };
        })
        .sort((a, b) => a.startKey.localeCompare(b.startKey));
      const currentPeriod = periods.find((period) => period.isCurrent)!;

      pass = {
        kind: type === "WEEKLY" ? "weekly" : "monthly",
        total,
        used: currentPeriod.used,
        remaining: currentPeriod.remaining,
        validUntilLabel,
        activeBookings,
        periods: input.range ? periods : undefined,
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
