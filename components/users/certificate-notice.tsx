import { HeartPulse } from "lucide-react";

import { certificateStatus, formatCertificateDate } from "@/lib/medical-certificate";
import { cn } from "@/lib/utils";

/**
 * Member home: the medical certificate needs attention (30 days or less, or expired).
 * Nothing renders while it is fine or when none is recorded.
 */
export function CertificateNotice({ expiresAt, locale, timeZone }: { expiresAt: Date | null; locale: string; timeZone: string }) {
  const { state, daysLeft } = certificateStatus(expiresAt);
  if (!expiresAt || state === "ok" || state === "none") return null;
  const isIt = locale === "it";
  const date = formatCertificateDate(expiresAt, locale, timeZone);

  const title =
    state === "expired"
      ? isIt ? "Certificato medico scaduto" : "Medical certificate expired"
      : daysLeft === 0
        ? isIt ? "Il certificato medico scade oggi" : "Your medical certificate expires today"
        : isIt ? `Il certificato medico scade il ${date}` : `Your medical certificate expires on ${date}`;
  const body =
    state === "expired"
      ? isIt
        ? `È scaduto il ${date}. Puoi ancora prenotare, ma ogni lezione va approvata dallo staff finché non ne porti uno nuovo.`
        : `It expired on ${date}. You can still book, but every lesson needs staff approval until you bring a new one.`
      : isIt
        ? "Portane uno nuovo in palestra: le lezioni dopo la scadenza restano prenotabili, ma vanno approvate dallo staff."
        : "Bring a new one to the gym: lessons after the expiry stay bookable, but need staff approval.";

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-2xl p-4",
        state === "expired"
          ? "bg-[var(--foreground)] text-[var(--background)]"
          : state === "urgent"
            ? "bg-[var(--danger-bg)] text-[var(--danger-fg)]"
            : "bg-[var(--warning-bg)] text-[var(--warning-fg)]"
      )}
    >
      <HeartPulse size={22} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div>
        <p className="text-[17px] font-semibold leading-snug">{title}</p>
        <p className="mt-1 text-[15px]">{body}</p>
      </div>
    </div>
  );
}
