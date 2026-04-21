import { prisma } from "@/lib/prisma";

type StopFn = () => void;
type Logger = (message: string) => void;

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;
const DEFAULT_CONSUMED_TOKEN_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function parsePositiveInt(input: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(input ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function startAuthCleanupJob(log: Logger): StopFn {
  const intervalMs = parsePositiveInt(process.env.AUTH_CLEANUP_INTERVAL_MS, DEFAULT_INTERVAL_MS);
  const consumedTokenRetentionMs = parsePositiveInt(
    process.env.AUTH_TOKEN_CONSUMED_RETENTION_MS,
    DEFAULT_CONSUMED_TOKEN_RETENTION_MS
  );

  let timer: NodeJS.Timeout | null = null;
  let stopped = false;
  let running = false;

  const tick = async () => {
    if (stopped || running) return;
    running = true;

    try {
      const now = new Date();
      const consumedTokenCutoff = new Date(now.getTime() - consumedTokenRetentionMs);

      const [sessions, authTokens, otpRateLimits] = await prisma.$transaction([
        prisma.session.deleteMany({
          where: {
            expiresAt: { lt: now },
          },
        }),
        prisma.authToken.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: now } },
              { consumedAt: { lt: consumedTokenCutoff } },
            ],
          },
        }),
        prisma.otpRateLimit.deleteMany({
          where: {
            expiresAt: { lt: now },
          },
        }),
      ]);

      const totalDeleted = sessions.count + authTokens.count + otpRateLimits.count;
      if (totalDeleted > 0) {
        log(
          `Auth cleanup removed ${totalDeleted} rows (sessions=${sessions.count}, authTokens=${authTokens.count}, otpRateLimits=${otpRateLimits.count}).`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Auth cleanup failed: ${message}`);
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
