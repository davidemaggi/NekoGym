import { prisma } from "@/lib/prisma";

type StopFn = () => void;
type Logger = (message: string) => void;

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

function parsePositiveInt(input: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(input ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function startLocalNotificationsRetentionJob(log: Logger): StopFn {
  const intervalMs = parsePositiveInt(process.env.LOCAL_NOTIFICATIONS_CLEANUP_INTERVAL_MS, DEFAULT_INTERVAL_MS);
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;
  let running = false;

  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      const now = new Date();
      const users = await prisma.user.findMany({
        select: { id: true, notificationsRetentionDays: true },
      });
      let deleted = 0;
      for (const user of users) {
        const retentionDays = Math.max(1, user.notificationsRetentionDays || 15);
        const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
        const result = await prisma.localNotification.deleteMany({
          where: {
            userId: user.id,
            createdAt: { lt: cutoff },
          },
        });
        deleted += result.count;
      }
      if (deleted > 0) {
        log(`Local notifications cleanup removed ${deleted} rows.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Local notifications cleanup failed: ${message}`);
    } finally {
      running = false;
    }
  };

  void tick();
  timer = setInterval(() => {
    void tick();
  }, intervalMs);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;
  };
}
