import { addDaysToKey } from "@/lib/lesson-recurrence";
import { appDateKey } from "@/lib/date-time";

/**
 * Medical certificate rules. The expiry is a calendar day on the gym's calendar: the certificate
 * is valid through that whole day.
 *
 * - ok: more than 30 days left · expiring: 30 days or less · urgent: 7 days or less · expired.
 * - Reminders: a "lite" one (in-app only) from 30 days before, a "strong" one (every channel)
 *   from 7 days before; each is sent once per certificate.
 * - A trainee may still book lessons that fall after the expiry, but those bookings always wait
 *   for staff approval, and both sides are told why.
 */

export const CERTIFICATE_LITE_DAYS = 30;
export const CERTIFICATE_STRONG_DAYS = 7;
export const CERTIFICATE_DEFAULT_VALIDITY_DAYS = 365;

export type CertificateState = "none" | "ok" | "expiring" | "urgent" | "expired";

function dayDiff(fromKey: string, toKey: string): number {
  const from = Date.UTC(Number(fromKey.slice(0, 4)), Number(fromKey.slice(5, 7)) - 1, Number(fromKey.slice(8, 10)));
  const to = Date.UTC(Number(toKey.slice(0, 4)), Number(toKey.slice(5, 7)) - 1, Number(toKey.slice(8, 10)));
  return Math.round((to - from) / 86_400_000);
}

/** Days left until the expiry day (0 = expires today, negative = expired) and the colour state. */
export function certificateStatus(expiresAt: Date | string | null | undefined, now: Date = new Date()): { state: CertificateState; daysLeft: number | null } {
  if (!expiresAt) return { state: "none", daysLeft: null };
  const daysLeft = dayDiff(appDateKey(now), appDateKey(new Date(expiresAt)));
  const state: CertificateState =
    daysLeft < 0 ? "expired" : daysLeft <= CERTIFICATE_STRONG_DAYS ? "urgent" : daysLeft <= CERTIFICATE_LITE_DAYS ? "expiring" : "ok";
  return { state, daysLeft };
}

export type CertificateApprovalReason = "certificateExpired" | "certificateExpiring";

/**
 * Why a booking for a lesson must wait for approval because of the certificate, or null.
 * Expired: it is already past its expiry today. Expiring: still valid today, but not on the lesson day.
 */
export function certificateApprovalReason(
  expiresAt: Date | null | undefined,
  lessonStartsAt: Date,
  now: Date = new Date()
): CertificateApprovalReason | null {
  if (!expiresAt) return null;
  const expiryKey = appDateKey(expiresAt);
  if (appDateKey(lessonStartsAt) <= expiryKey) return null;
  return appDateKey(now) > expiryKey ? "certificateExpired" : "certificateExpiring";
}

/** The default expiry for a certificate handed in on `submittedKey` (YYYY-MM-DD). */
export function defaultCertificateExpiryKey(submittedKey: string): string {
  return addDaysToKey(submittedKey, CERTIFICATE_DEFAULT_VALIDITY_DAYS);
}

/** Sentence explaining why a booking waits for approval, for the trainee and for staff. */
export function certificateReasonText(reason: CertificateApprovalReason, expiryLabel: string, locale: string, audience: "trainee" | "staff", traineeName?: string): string {
  const isIt = locale === "it";
  if (audience === "trainee") {
    return reason === "certificateExpired"
      ? isIt
        ? `Va approvata perché il tuo certificato medico è scaduto il ${expiryLabel}.`
        : `It needs approval because your medical certificate expired on ${expiryLabel}.`
      : isIt
        ? `Va approvata perché il tuo certificato medico scade il ${expiryLabel}, prima della lezione.`
        : `It needs approval because your medical certificate expires on ${expiryLabel}, before the lesson.`;
  }
  const who = traineeName ?? (isIt ? "L'iscritto" : "The member");
  return reason === "certificateExpired"
    ? isIt
      ? `Motivo: il certificato medico di ${who} è scaduto il ${expiryLabel}.`
      : `Reason: ${who}'s medical certificate expired on ${expiryLabel}.`
    : isIt
      ? `Motivo: il certificato medico di ${who} scade il ${expiryLabel}, prima della lezione.`
      : `Reason: ${who}'s medical certificate expires on ${expiryLabel}, before the lesson.`;
}

/** "12 mar 2027" in the gym's calendar. */
export function formatCertificateDate(value: Date | string, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", { timeZone, day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

/** Short line for staff next to a pending request ("Certificato scaduto il 3 nov 2026"), or null. */
export function staffCertificateNote(
  expiresAt: Date | null | undefined,
  lessonStartsAt: Date,
  locale: string,
  timeZone: string,
  now: Date = new Date()
): string | null {
  const reason = certificateApprovalReason(expiresAt, lessonStartsAt, now);
  if (!reason || !expiresAt) return null;
  const label = formatCertificateDate(expiresAt, locale, timeZone);
  const isIt = locale === "it";
  return reason === "certificateExpired"
    ? isIt ? `Certificato medico scaduto il ${label}` : `Medical certificate expired on ${label}`
    : isIt ? `Certificato medico in scadenza il ${label}` : `Medical certificate expires on ${label}`;
}
