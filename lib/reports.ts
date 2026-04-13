import type { Prisma, PrismaClient } from "@prisma/client";

export const REPORT_IDS = [
  "COURSE_POPULARITY",
  "TIME_CROWDING",
  "TRAINER_PERFORMANCE",
  "NO_SHOW_ANALYTICS",
] as const;

export type ReportId = (typeof REPORT_IDS)[number];

type ReportsDbClient = PrismaClient | Prisma.TransactionClient;

type ReportLesson = {
  id: string;
  startsAt: Date;
  maxAttendees: number;
  courseId: string | null;
  trainerId: string | null;
  course: { name: string } | null;
  trainer: { name: string } | null;
  bookings: Array<{
    traineeId: string;
    status: "PENDING" | "CONFIRMED";
    attendanceStatus: "PRESENT" | "NO_SHOW" | null;
    trainee: { id: string; name: string };
  }>;
};

export type CoursePopularityRow = {
  courseId: string;
  courseName: string;
  lessonsCount: number;
  totalBookings: number;
  totalCapacity: number;
  avgAttendees: number;
  fillRatePct: number;
};

export type TimeCrowdingRow = {
  weekday: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  hour: number;
  slotLabel: string;
  lessonsCount: number;
  totalBookings: number;
  totalCapacity: number;
  fillRatePct: number;
};

export type TrainerPerformanceRow = {
  trainerId: string;
  trainerName: string;
  lessonsCount: number;
  totalBookings: number;
  uniqueTrainees: number;
  totalCapacity: number;
  avgAttendees: number;
  fillRatePct: number;
};

export type CourseHealthRow = {
  courseId: string;
  courseName: string;
  totalBookings: number;
  fillRatePct: number;
  noShowRatePct: number;
};

export type NoShowAnalyticsRow = {
  traineeId: string;
  traineeName: string;
  totalBookings: number;
  markedAttendances: number;
  presentCount: number;
  noShowCount: number;
  noShowRatePct: number;
};

export type ReportsSnapshot = {
  range: {
    from: Date;
    to: Date;
    days: number;
    generatedAt: Date;
  };
  totals: {
    lessonsCount: number;
    totalBookings: number;
    avgFillRatePct: number;
  };
  coursePopularity: CoursePopularityRow[];
  timeCrowding: TimeCrowdingRow[];
  trainerPerformance: TrainerPerformanceRow[];
  courseHealth: CourseHealthRow[];
  noShowAnalytics: NoShowAnalyticsRow[];
};

function toPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function parseReportDays(input?: string | null): number {
  const parsed = Number.parseInt(input ?? "", 10);
  if (Number.isNaN(parsed)) return 30;
  if (parsed === 7 || parsed === 30 || parsed === 90) return parsed;
  return 30;
}

export function reportRangeForDays(days: number, now = new Date()): { from: Date; to: Date } {
  const to = new Date(now);
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to };
}

export function parseSelectedReportIds(input: string | null | undefined): ReportId[] {
  if (!input) return [...REPORT_IDS];
  const allowed = new Set<ReportId>(REPORT_IDS);
  const picked = input
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter((part): part is ReportId => allowed.has(part as ReportId));
  return picked.length > 0 ? Array.from(new Set(picked)) : [...REPORT_IDS];
}

export function selectedReportIdsToCsv(ids: ReportId[]): string {
  const unique = Array.from(new Set(ids));
  const allowed = new Set<ReportId>(REPORT_IDS);
  const safe = unique.filter((id): id is ReportId => allowed.has(id));
  return (safe.length > 0 ? safe : [...REPORT_IDS]).join(",");
}

function weekdayFromDate(date: Date): TimeCrowdingRow["weekday"] {
  const day = date.getDay();
  if (day === 0) return "SUNDAY";
  if (day === 1) return "MONDAY";
  if (day === 2) return "TUESDAY";
  if (day === 3) return "WEDNESDAY";
  if (day === 4) return "THURSDAY";
  if (day === 5) return "FRIDAY";
  return "SATURDAY";
}

const WEEKDAY_SORT: Record<TimeCrowdingRow["weekday"], number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
};

async function loadLessons(db: ReportsDbClient, from: Date, to: Date): Promise<ReportLesson[]> {
  const rows = await db.lesson.findMany({
    where: {
      deletedAt: null,
      status: "SCHEDULED",
      startsAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      startsAt: true,
      maxAttendees: true,
      courseId: true,
      trainerId: true,
      course: {
        select: {
          name: true,
        },
      },
      trainer: {
        select: {
          name: true,
        },
      },
      bookings: {
        select: {
          traineeId: true,
          status: true,
          attendanceStatus: true,
          trainee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  return rows;
}

export async function buildReportsSnapshot(
  db: ReportsDbClient,
  input: { from: Date; to: Date; days: number }
): Promise<ReportsSnapshot> {
  const lessons = await loadLessons(db, input.from, input.to);

  const courseMap = new Map<string, Omit<CoursePopularityRow, "fillRatePct" | "avgAttendees">>();
  const timeMap = new Map<string, Omit<TimeCrowdingRow, "fillRatePct">>();
  const trainerMap = new Map<
    string,
    Omit<TrainerPerformanceRow, "fillRatePct" | "avgAttendees" | "uniqueTrainees"> & { traineeIds: Set<string> }
  >();
  const courseHealthMap = new Map<
    string,
    {
      courseId: string;
      courseName: string;
      totalBookings: number;
      totalCapacity: number;
      noShowCount: number;
    }
  >();
  const noShowMap = new Map<string, Omit<NoShowAnalyticsRow, "noShowRatePct">>();

  let globalCapacity = 0;
  let globalBookings = 0;

  for (const lesson of lessons) {
    const confirmedBookings = lesson.bookings.filter((row) => row.status === "CONFIRMED");
    const confirmedCount = confirmedBookings.length;

    globalCapacity += lesson.maxAttendees;
    globalBookings += confirmedCount;

    if (lesson.courseId) {
      const current = courseMap.get(lesson.courseId) ?? {
        courseId: lesson.courseId,
        courseName: lesson.course?.name ?? "Course",
        lessonsCount: 0,
        totalBookings: 0,
        totalCapacity: 0,
      };
      current.lessonsCount += 1;
      current.totalBookings += confirmedCount;
      current.totalCapacity += lesson.maxAttendees;
      courseMap.set(lesson.courseId, current);

      const health = courseHealthMap.get(lesson.courseId) ?? {
        courseId: lesson.courseId,
        courseName: lesson.course?.name ?? "Course",
        totalBookings: 0,
        totalCapacity: 0,
        noShowCount: 0,
      };
      health.totalBookings += confirmedCount;
      health.totalCapacity += lesson.maxAttendees;
      health.noShowCount += confirmedBookings.filter((b) => b.attendanceStatus === "NO_SHOW").length;
      courseHealthMap.set(lesson.courseId, health);
    }

    const weekday = weekdayFromDate(lesson.startsAt);
    const hour = lesson.startsAt.getHours();
    const key = `${weekday}:${String(hour).padStart(2, "0")}`;
    const slot = timeMap.get(key) ?? {
      weekday,
      hour,
      slotLabel: `${String(hour).padStart(2, "0")}:00`,
      lessonsCount: 0,
      totalBookings: 0,
      totalCapacity: 0,
    };
    slot.lessonsCount += 1;
    slot.totalBookings += confirmedCount;
    slot.totalCapacity += lesson.maxAttendees;
    timeMap.set(key, slot);

    const trainerKey = lesson.trainerId ?? "unassigned";
    const trainer = trainerMap.get(trainerKey) ?? {
      trainerId: trainerKey,
      trainerName: lesson.trainer?.name ?? "Unassigned",
      lessonsCount: 0,
      totalBookings: 0,
      totalCapacity: 0,
      traineeIds: new Set<string>(),
    };
    trainer.lessonsCount += 1;
    trainer.totalBookings += confirmedCount;
    trainer.totalCapacity += lesson.maxAttendees;
    for (const booking of confirmedBookings) {
      trainer.traineeIds.add(booking.traineeId);
    }
    trainerMap.set(trainerKey, trainer);

    for (const booking of confirmedBookings) {
      const current = noShowMap.get(booking.trainee.id) ?? {
        traineeId: booking.trainee.id,
        traineeName: booking.trainee.name,
        totalBookings: 0,
        markedAttendances: 0,
        presentCount: 0,
        noShowCount: 0,
      };
      current.totalBookings += 1;
      if (booking.attendanceStatus === "PRESENT") {
        current.markedAttendances += 1;
        current.presentCount += 1;
      } else if (booking.attendanceStatus === "NO_SHOW") {
        current.markedAttendances += 1;
        current.noShowCount += 1;
      }
      noShowMap.set(booking.trainee.id, current);
    }
  }

  const coursePopularity: CoursePopularityRow[] = Array.from(courseMap.values())
    .map((row) => ({
      ...row,
      avgAttendees: round1(row.totalBookings / Math.max(1, row.lessonsCount)),
      fillRatePct: toPercent(row.totalBookings, row.totalCapacity),
    }))
    .sort((a, b) => {
      if (b.totalBookings !== a.totalBookings) return b.totalBookings - a.totalBookings;
      return b.fillRatePct - a.fillRatePct;
    });

  const timeCrowding: TimeCrowdingRow[] = Array.from(timeMap.values())
    .map((row) => ({
      ...row,
      fillRatePct: toPercent(row.totalBookings, row.totalCapacity),
    }))
    .sort((a, b) => {
      if (b.fillRatePct !== a.fillRatePct) return b.fillRatePct - a.fillRatePct;
      if (WEEKDAY_SORT[a.weekday] !== WEEKDAY_SORT[b.weekday]) {
        return WEEKDAY_SORT[a.weekday] - WEEKDAY_SORT[b.weekday];
      }
      return a.hour - b.hour;
    });

  const trainerPerformance: TrainerPerformanceRow[] = Array.from(trainerMap.values())
    .map((row) => ({
      trainerId: row.trainerId,
      trainerName: row.trainerName,
      lessonsCount: row.lessonsCount,
      totalBookings: row.totalBookings,
      uniqueTrainees: row.traineeIds.size,
      totalCapacity: row.totalCapacity,
      avgAttendees: round1(row.totalBookings / Math.max(1, row.lessonsCount)),
      fillRatePct: toPercent(row.totalBookings, row.totalCapacity),
    }))
    .sort((a, b) => {
      if (b.totalBookings !== a.totalBookings) return b.totalBookings - a.totalBookings;
      return b.fillRatePct - a.fillRatePct;
    });

  const courseHealth: CourseHealthRow[] = Array.from(courseHealthMap.values())
    .map((row) => ({
      courseId: row.courseId,
      courseName: row.courseName,
      totalBookings: row.totalBookings,
      fillRatePct: toPercent(row.totalBookings, row.totalCapacity),
      noShowRatePct: toPercent(row.noShowCount, row.totalBookings),
    }))
    .sort((a, b) => {
      if (b.totalBookings !== a.totalBookings) return b.totalBookings - a.totalBookings;
      return b.fillRatePct - a.fillRatePct;
    });

  const noShowAnalytics: NoShowAnalyticsRow[] = Array.from(noShowMap.values())
    .map((row) => ({
      ...row,
      noShowRatePct: toPercent(row.noShowCount, row.totalBookings),
    }))
    .sort((a, b) => {
      if (b.noShowCount !== a.noShowCount) return b.noShowCount - a.noShowCount;
      return b.noShowRatePct - a.noShowRatePct;
    });

  return {
    range: {
      from: input.from,
      to: input.to,
      days: input.days,
      generatedAt: new Date(),
    },
    totals: {
      lessonsCount: lessons.length,
      totalBookings: globalBookings,
      avgFillRatePct: toPercent(globalBookings, globalCapacity),
    },
    coursePopularity,
    timeCrowding,
    trainerPerformance,
    courseHealth,
    noShowAnalytics,
  };
}

function reportLabel(locale: "it" | "en", id: ReportId): string {
  const labels: Record<ReportId, { it: string; en: string }> = {
    COURSE_POPULARITY: { it: "Corsi piu seguiti", en: "Most attended courses" },
    TIME_CROWDING: { it: "Orari piu affollati", en: "Most crowded time slots" },
    TRAINER_PERFORMANCE: { it: "Trainer piu seguiti", en: "Most attended trainers" },
    NO_SHOW_ANALYTICS: { it: "No-show per trainee", en: "No-show by trainee" },
  };
  return labels[id][locale];
}

export function buildReportDigestEmail(input: {
  locale: "it" | "en";
  days: number;
  selectedReportIds: ReportId[];
  snapshot: ReportsSnapshot;
  appBaseUrl: string;
}): { subject: string; body: string } {
  const locale = input.locale;
  const title =
    locale === "it"
      ? `NekoGym report automatici (${input.days} giorni)`
      : `NekoGym automated reports (${input.days} days)`;
  const reportUrl = `${input.appBaseUrl}/${locale}/reports?days=${input.days}`;

  const lines: string[] = [];
  lines.push(title);
  lines.push("");
  lines.push(
    locale === "it"
      ? `Periodo: ultimi ${input.days} giorni`
      : `Period: last ${input.days} days`
  );
  lines.push(
    locale === "it"
      ? `Lezioni: ${input.snapshot.totals.lessonsCount} | Prenotazioni: ${input.snapshot.totals.totalBookings} | Riempimento medio: ${input.snapshot.totals.avgFillRatePct}%`
      : `Lessons: ${input.snapshot.totals.lessonsCount} | Bookings: ${input.snapshot.totals.totalBookings} | Avg fill rate: ${input.snapshot.totals.avgFillRatePct}%`
  );
  lines.push("");

  for (const id of input.selectedReportIds) {
    lines.push(`${reportLabel(locale, id)}:`);
    if (id === "COURSE_POPULARITY") {
      const top = input.snapshot.coursePopularity.slice(0, 5);
      if (top.length === 0) {
        lines.push(locale === "it" ? "- Nessun dato" : "- No data");
      } else {
        for (const row of top) {
          lines.push(
            `- ${row.courseName}: ${row.totalBookings} ${locale === "it" ? "prenotazioni" : "bookings"}, ${row.fillRatePct}%`
          );
        }
      }
    } else if (id === "TIME_CROWDING") {
      const top = input.snapshot.timeCrowding.slice(0, 5);
      if (top.length === 0) {
        lines.push(locale === "it" ? "- Nessun dato" : "- No data");
      } else {
        for (const row of top) {
          lines.push(`- ${row.weekday} ${row.slotLabel}: ${row.totalBookings} / ${row.totalCapacity} (${row.fillRatePct}%)`);
        }
      }
    } else {
      if (id === "TRAINER_PERFORMANCE") {
        const top = input.snapshot.trainerPerformance.slice(0, 5);
        if (top.length === 0) {
          lines.push(locale === "it" ? "- Nessun dato" : "- No data");
        } else {
          for (const row of top) {
            lines.push(`- ${row.trainerName}: ${row.totalBookings} ${locale === "it" ? "prenotazioni" : "bookings"}, ${row.fillRatePct}%`);
          }
        }
      } else if (id === "NO_SHOW_ANALYTICS") {
        const top = input.snapshot.noShowAnalytics.slice(0, 5);
        if (top.length === 0) {
          lines.push(locale === "it" ? "- Nessun dato" : "- No data");
        } else {
          for (const row of top) {
            lines.push(
              `- ${row.traineeName}: no-show ${row.noShowCount}/${row.totalBookings} (${row.noShowRatePct}%)`
            );
          }
        }
      } else {
        lines.push(locale === "it" ? "- Nessun dato" : "- No data");
      }
    }
    lines.push("");
  }

  lines.push(
    locale === "it"
      ? `Apri i report in app: ${reportUrl}`
      : `Open reports in app: ${reportUrl}`
  );

  return {
    subject: title,
    body: lines.join("\n"),
  };
}
