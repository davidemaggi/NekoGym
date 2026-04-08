import { startDailyLessonsReconcileJob } from "@/server/jobs/daily-lessons-reconcile";
import { startTelegramBot } from "@/server/telegram/bootstrap";

type StopFn = () => void;

type Logger = (message: string) => void;

export function startBackgroundServices(log: Logger): StopFn {
  const stops: StopFn[] = [];

  stops.push(startDailyLessonsReconcileJob(log));
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

