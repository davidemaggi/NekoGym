import { prisma } from "@/lib/prisma";
import { cancelLessonsEnteringNoticeWindow } from "@/lib/lessons";

type Logger = (message: string) => void;

export function startLessonsNoticeWindowJob(log: Logger): () => void {
  const pollMsRaw = Number.parseInt(process.env.LESSON_NOTICE_WINDOW_POLL_MS ?? "300000", 10);
  const pollMs = Number.isNaN(pollMsRaw) || pollMsRaw < 60_000 ? 300_000 : pollMsRaw;

  let intervalId: NodeJS.Timeout | null = null;
  let running = false;
  let stopped = false;

  async function run() {
    if (running || stopped) return;
    running = true;

    try {
      const cancelled = await prisma.$transaction(async (tx) => cancelLessonsEnteringNoticeWindow(tx));
      if (cancelled > 0) {
        log(`Lessons notice-window auto-cancel completed: cancelled=${cancelled}`);
      }
    } catch (error) {
      log(`Lessons notice-window auto-cancel failed: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      running = false;
    }
  }

  intervalId = setInterval(() => {
    void run();
  }, pollMs);

  void run();
  log(`Lessons notice-window auto-cancel job started (poll ${pollMs}ms)`);

  return () => {
    stopped = true;
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}


