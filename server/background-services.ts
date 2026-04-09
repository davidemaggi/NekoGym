import { startDailyLessonsReconcileJob } from "@/server/jobs/daily-lessons-reconcile";
import { startLessonsNoticeWindowJob } from "@/server/jobs/lessons-notice-window";
import { startOutboxWorker } from "@/server/outbox/worker";
import { startTelegramBot } from "@/server/telegram/bootstrap";

type StopFn = () => void;

type Logger = (message: string) => void;

export function startBackgroundServices(log: Logger): StopFn {
  const stops: StopFn[] = [];

  stops.push(startDailyLessonsReconcileJob(log));
  stops.push(startLessonsNoticeWindowJob(log));
  stops.push(startOutboxWorker(log));
  stops.push(startTelegramBot(log));

  return () => {
    for (const stop of stops.reverse()) {
      try {
        stop();
      } catch {
        // Ignore shutdown errors from background workers.
      }
    }
  };
}

