import { getAppDateTimeConfig, parseDateInputToUtc } from "@/lib/date-time";
import { prisma } from "@/lib/prisma";

type StopFn = () => void;
type Logger = (message: string) => void;

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

function parsePositiveInt(input: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(input ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function startOfTodayInAppTimezone(now: Date): Date {
  const { timeZone } = getAppDateTimeConfig();
  const label = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const parsed = parseDateInputToUtc(label);
  if (parsed) return parsed;

  const fallback = new Date(now);
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

export function startLessonAttendanceAutoConfirmJob(log: Logger): StopFn {
  const intervalMs = parsePositiveInt(
    process.env.LESSON_ATTENDANCE_AUTOCONFIRM_INTERVAL_MS,
    DEFAULT_INTERVAL_MS
  );

  let timer: NodeJS.Timeout | null = null;
  let stopped = false;
  let running = false;

  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      const now = new Date();
      const todayStart = startOfTodayInAppTimezone(now);

      const result = await prisma.lessonBooking.updateMany({
        where: {
          status: "CONFIRMED",
          attendanceStatus: null,
          lesson: {
            status: "SCHEDULED",
            deletedAt: null,
            startsAt: { lt: todayStart },
          },
        },
        data: {
          attendanceStatus: "PRESENT",
          attendanceMarkedAt: now,
          attendanceMarkedById: null,
        },
      });

      if (result.count > 0) {
        log(`Lesson attendance auto-confirm marked ${result.count} booking(s) as PRESENT.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Lesson attendance auto-confirm failed: ${message}`);
    } finally {
      running = false;
    }
  };

  void tick();
  timer = setInterval(() => {
    void tick();
  }, intervalMs);

  log(`Lesson attendance auto-confirm job started (poll ${intervalMs}ms)`);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;
  };
}
