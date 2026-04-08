import { prisma } from "@/lib/prisma";
import { reconcileFutureLessonsForAllCourses } from "@/lib/lessons";

type Logger = (message: string) => void;

function parseDailyTime(value: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { hour: 3, minute: 0 };

  const hour = Number.parseInt(match[1] ?? "", 10);
  const minute = Number.parseInt(match[2] ?? "", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) {
    return { hour: 3, minute: 0 };
  }

  return { hour, minute };
}

function msUntilNextRun(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

export function startDailyLessonsReconcileJob(log: Logger): () => void {
  const configuredTime = process.env.LESSON_RECONCILE_DAILY_AT ?? "03:00";
  const { hour, minute } = parseDailyTime(configuredTime);

  let timeoutId: NodeJS.Timeout | null = null;
  let stopped = false;
  let running = false;

  async function run() {
    if (running || stopped) return;
    running = true;
    try {
      const stats = await prisma.$transaction(async (tx) => reconcileFutureLessonsForAllCourses(tx));
      log(
        `Lessons reconcile completed: courses=${stats.coursesProcessed}, created=${stats.created}, updated=${stats.updated}, cancelled=${stats.cancelled}, deleted=${stats.deleted}`
      );
    } catch (error) {
      log(`Lessons reconcile failed: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      running = false;
      schedule();
    }
  }

  function schedule() {
    if (stopped) return;
    const wait = msUntilNextRun(hour, minute);
    timeoutId = setTimeout(() => {
      void run();
    }, wait);
  }

  if (process.env.LESSON_RECONCILE_RUN_ON_STARTUP === "true") {
    void run();
  } else {
    schedule();
  }

  log(`Daily lessons reconcile scheduled at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);

  return () => {
    stopped = true;
    if (timeoutId) clearTimeout(timeoutId);
  };
}

