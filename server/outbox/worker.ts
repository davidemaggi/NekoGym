import { prisma } from "@/lib/prisma";
import { sendOutboxItem } from "@/server/outbox/senders";

type Logger = (message: string) => void;

type OutboxStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED";

const MAX_ATTEMPTS = 5;
const DEFAULT_POLL_MS = 4000;

function parsePollMs(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1000) return DEFAULT_POLL_MS;
  return parsed;
}

function nextRetryAt(attempts: number): Date {
  const backoffSeconds = Math.min(300, 5 * attempts);
  return new Date(Date.now() + backoffSeconds * 1000);
}

export function startOutboxWorker(log: Logger): () => void {
  const pollMs = parsePollMs(process.env.OUTBOX_POLL_MS);
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;
  let running = false;

  async function runOnce() {
    if (stopped || running) return;
    running = true;

    try {
      const now = new Date();
      const pending = await prisma.notificationOutbox.findMany({
        where: {
          status: "PENDING" satisfies OutboxStatus,
          availableAt: { lte: now },
        },
        include: {
          user: {
            select: {
              email: true,
              emailVerifiedAt: true,
              telegramChatId: true,
            },
          },
        },
        orderBy: [{ createdAt: "asc" }],
        take: 30,
      });

      for (const item of pending) {
        if (!item.user.emailVerifiedAt && !item.allowUnverifiedEmail) {
          await prisma.notificationOutbox.update({
            where: { id: item.id },
            data: {
              status: "FAILED",
              attempts: { increment: 1 },
              lastError: "User email is not verified",
            },
          });
          continue;
        }

        await prisma.notificationOutbox.update({
          where: { id: item.id },
          data: { status: "PROCESSING" },
        });

        try {
          await sendOutboxItem(item);
          await prisma.notificationOutbox.update({
            where: { id: item.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              attempts: { increment: 1 },
              lastError: null,
            },
          });
        } catch (error) {
          const attempts = item.attempts + 1;
          const message = error instanceof Error ? error.message : "unknown error";
          await prisma.notificationOutbox.update({
            where: { id: item.id },
            data: {
              status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
              attempts,
              lastError: message,
              availableAt: attempts >= MAX_ATTEMPTS ? item.availableAt : nextRetryAt(attempts),
            },
          });
        }
      }
    } catch (error) {
      log(`Outbox worker error: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      running = false;
      schedule();
    }
  }

  function schedule() {
    if (stopped) return;
    timer = setTimeout(() => {
      void runOnce();
    }, pollMs);
  }

  schedule();
  log(`Outbox worker started (poll ${pollMs}ms)`);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    log("Outbox worker stopped");
  };
}

