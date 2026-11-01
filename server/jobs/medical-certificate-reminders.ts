import { getAppDateTimeConfig } from "@/lib/date-time";
import {
  CERTIFICATE_LITE_DAYS,
  CERTIFICATE_STRONG_DAYS,
  certificateStatus,
  formatCertificateDate,
} from "@/lib/medical-certificate";
import { prisma } from "@/lib/prisma";
import { enqueueNotificationForUsers } from "@/server/outbox/queue";

type StopFn = () => void;
type Logger = (message: string) => void;

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

function parsePositiveInt(input: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(input ?? "", 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

/**
 * Medical certificate reminders, to the member and to every admin and trainer:
 * - lite (in-app inbox only) once the expiry is 30 days away or less;
 * - strong (every channel) once it is 7 days away or less, or already expired.
 * Each is sent once per certificate: recording a new certificate clears both marks.
 */
export async function runMedicalCertificateReminders(log: Logger, now = new Date()) {
  const { timeZone } = getAppDateTimeConfig();
  const candidates = await prisma.user.findMany({
    where: {
      isDisabled: false,
      medicalCertificateExpiresAt: { not: null },
      OR: [{ medicalCertificateLiteNoticeAt: null }, { medicalCertificateStrongNoticeAt: null }],
    },
    select: {
      id: true,
      name: true,
      telegramChatId: true,
      medicalCertificateExpiresAt: true,
      medicalCertificateLiteNoticeAt: true,
      medicalCertificateStrongNoticeAt: true,
    },
  });
  if (candidates.length === 0) return;

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "TRAINER"] }, isDisabled: false },
    select: { id: true, telegramChatId: true },
  });

  for (const user of candidates) {
    const { daysLeft } = certificateStatus(user.medicalCertificateExpiresAt, now);
    if (daysLeft === null || daysLeft > CERTIFICATE_LITE_DAYS) continue;

    const strong = daysLeft <= CERTIFICATE_STRONG_DAYS;
    if (strong ? user.medicalCertificateStrongNoticeAt : user.medicalCertificateLiteNoticeAt) continue;

    const date = formatCertificateDate(user.medicalCertificateExpiresAt!, "it", timeZone);
    const when = daysLeft < 0 ? `è scaduto il ${date}` : daysLeft === 0 ? `scade oggi (${date})` : `scade il ${date}`;
    const staffTargets = staff.filter((member) => member.id !== user.id);

    await prisma.$transaction(async (tx) => {
      await enqueueNotificationForUsers(tx, [{ id: user.id, telegramChatId: user.telegramChatId }], {
        subject: daysLeft < 0 ? "Certificato medico scaduto" : strong ? "Certificato medico: rinnovalo subito" : "Certificato medico in scadenza",
        body: `Il tuo certificato medico ${when}. Portane uno nuovo in palestra: le lezioni dopo la scadenza restano prenotabili, ma vanno approvate dallo staff.`,
        localOnly: !strong,
      });
      if (staffTargets.length > 0) {
        await enqueueNotificationForUsers(tx, staffTargets, {
          subject:
            daysLeft < 0
              ? `Certificato medico di ${user.name} scaduto`
              : strong
                ? `Certificato medico di ${user.name}: scadenza vicina`
                : `Certificato medico di ${user.name} in scadenza`,
          body: `Il certificato medico di ${user.name} ${when}.`,
          localOnly: !strong,
        });
      }
      // A strong notice also covers the lite one (e.g. a certificate recorded already close to expiry).
      await tx.user.update({
        where: { id: user.id },
        data: strong
          ? { medicalCertificateStrongNoticeAt: now, medicalCertificateLiteNoticeAt: user.medicalCertificateLiteNoticeAt ?? now }
          : { medicalCertificateLiteNoticeAt: now },
      });
    });
    log(`[medical-certificate] ${strong ? "strong" : "lite"} reminder user=${user.id} daysLeft=${daysLeft} staff=${staffTargets.length}`);
  }
}

export function startMedicalCertificateRemindersJob(log: Logger): StopFn {
  const intervalMs = parsePositiveInt(process.env.MEDICAL_CERTIFICATE_REMINDERS_INTERVAL_MS, DEFAULT_INTERVAL_MS);
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;
  let running = false;

  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      await runMedicalCertificateReminders(log);
    } catch (error) {
      log(`[medical-certificate] reminders failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      running = false;
    }
  };

  void tick();
  timer = setInterval(() => void tick(), intervalMs);
  log(`Medical certificate reminders job started (poll ${intervalMs}ms)`);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
  };
}
