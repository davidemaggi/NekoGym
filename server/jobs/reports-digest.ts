import { prisma } from "@/lib/prisma";
import {
  buildReportDigestEmail,
  buildReportsSnapshot,
  parseSelectedReportIds,
  reportRangeForDays,
} from "@/lib/reports";
import { enqueueEmailForUser } from "@/server/outbox/queue";

type Logger = (message: string) => void;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function parseDailyTime(value: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { hour: 8, minute: 0 };

  const hour = Number.parseInt(match[1] ?? "", 10);
  const minute = Number.parseInt(match[2] ?? "", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) {
    return { hour: 8, minute: 0 };
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

function isDue(frequency: "WEEKLY" | "MONTHLY", lastSentAt: Date | null, now: Date): boolean {
  if (!lastSentAt) return true;
  const delta = now.getTime() - lastSentAt.getTime();
  return frequency === "WEEKLY" ? delta >= WEEK_MS : delta >= MONTH_MS;
}

function parseDigestLocale(): "it" | "en" {
  return process.env.REPORT_DIGEST_LOCALE?.trim().toLowerCase() === "en" ? "en" : "it";
}

function getAppBaseUrl(): string {
  const raw = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function startReportsDigestJob(log: Logger): () => void {
  const configuredTime = process.env.REPORT_DIGEST_DAILY_AT ?? "08:00";
  const { hour, minute } = parseDailyTime(configuredTime);
  const digestLocale = parseDigestLocale();
  const appBaseUrl = getAppBaseUrl();

  let timeoutId: NodeJS.Timeout | null = null;
  let stopped = false;
  let running = false;

  async function run() {
    if (stopped || running) return;
    running = true;
    try {
      const now = new Date();
      const admins = await prisma.user.findMany({
        where: {
          role: "ADMIN",
          emailVerifiedAt: { not: null },
          notifyByEmail: true,
          reportDigestFrequency: { in: ["WEEKLY", "MONTHLY"] },
        },
        select: {
          id: true,
          reportDigestFrequency: true,
          reportDigestReportsCsv: true,
          reportDigestLastSentAt: true,
        },
      });

      if (admins.length === 0) {
        return;
      }

      const snapshotCache = new Map<number, Awaited<ReturnType<typeof buildReportsSnapshot>>>();
      let sent = 0;

      for (const admin of admins) {
        const frequency = admin.reportDigestFrequency as "WEEKLY" | "MONTHLY";
        if (!isDue(frequency, admin.reportDigestLastSentAt, now)) {
          continue;
        }

        const days = frequency === "WEEKLY" ? 7 : 30;
        let snapshot = snapshotCache.get(days);
        if (!snapshot) {
          const { from, to } = reportRangeForDays(days, now);
          snapshot = await buildReportsSnapshot(prisma, { from, to, days });
          snapshotCache.set(days, snapshot);
        }

        const selectedReportIds = parseSelectedReportIds(admin.reportDigestReportsCsv);
        const email = buildReportDigestEmail({
          locale: digestLocale,
          days,
          selectedReportIds,
          snapshot,
          appBaseUrl,
        });

        await prisma.$transaction(async (tx) => {
          await enqueueEmailForUser(tx, {
            userId: admin.id,
            subject: email.subject,
            body: email.body,
          });

          await tx.user.update({
            where: { id: admin.id },
            data: { reportDigestLastSentAt: now },
          });
        });

        sent += 1;
      }

      if (sent > 0) {
        log(`Reports digest queued for ${sent} admin user(s).`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      log(`Reports digest job failed: ${message}`);
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

  if (process.env.REPORT_DIGEST_RUN_ON_STARTUP === "true") {
    void run();
  } else {
    schedule();
  }

  log(`Reports digest scheduled daily at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);

  return () => {
    stopped = true;
    if (timeoutId) clearTimeout(timeoutId);
  };
}
