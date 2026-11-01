"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse } from "lucide-react";
import { toast } from "sonner";

import { clearMedicalCertificateAction, recordMedicalCertificateAction } from "@/app/[locale]/(app)/users/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appDateKey, getAppDateTimeConfig } from "@/lib/date-time";
import { certificateStatus, defaultCertificateExpiryKey, formatCertificateDate, type CertificateState } from "@/lib/medical-certificate";
import { cn } from "@/lib/utils";

const TEXT = {
  it: {
    none: "Nessun certificato",
    ok: (date: string) => `Certificato fino al ${date}`,
    expiring: (date: string) => `Certificato scade il ${date}`,
    urgent: (days: number) => (days === 0 ? "Certificato scade oggi" : days === 1 ? "Certificato scade domani" : `Certificato scade tra ${days} giorni`),
    expired: (date: string) => `Certificato scaduto il ${date}`,
    title: "Certificato medico presentato",
    description: (name: string) => `Registra il certificato di ${name}. Le lezioni dopo la scadenza resteranno prenotabili solo con approvazione.`,
    submitted: "Presentato il",
    expires: "Scade il",
    expiresHint: "Di norma un anno dopo la presentazione.",
    save: "Salva certificato",
    saving: "Salvataggio…",
    cancel: "Annulla",
    remove: "Rimuovi certificato",
    current: (date: string, expiry: string) => `Attuale: presentato il ${date}, scade il ${expiry}.`,
  },
  en: {
    none: "No certificate",
    ok: (date: string) => `Certificate until ${date}`,
    expiring: (date: string) => `Certificate expires ${date}`,
    urgent: (days: number) => (days === 0 ? "Certificate expires today" : days === 1 ? "Certificate expires tomorrow" : `Certificate expires in ${days} days`),
    expired: (date: string) => `Certificate expired ${date}`,
    title: "Medical certificate submitted",
    description: (name: string) => `Record ${name}'s certificate. Lessons after the expiry stay bookable, with approval only.`,
    submitted: "Submitted on",
    expires: "Expires on",
    expiresHint: "Usually one year after submission.",
    save: "Save certificate",
    saving: "Saving…",
    cancel: "Cancel",
    remove: "Remove certificate",
    current: (date: string, expiry: string) => `Current: submitted ${date}, expires ${expiry}.`,
  },
} as const;

// Colour is never alone: every state also says it in words.
const TONE: Record<CertificateState, string> = {
  none: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  ok: "bg-[var(--success-bg)] text-[var(--success-fg)]",
  expiring: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
  urgent: "bg-[var(--danger-bg)] text-[var(--danger-fg)]",
  expired: "bg-[var(--foreground)] text-[var(--background)]",
};

function textFor(locale: string) {
  return TEXT[locale === "en" ? "en" : "it"];
}

/** Medical certificate state as a chip: green > 30 days, yellow ≤ 30, red ≤ 7, black once expired. */
export function MedicalCertificateBadge({ expiresAt, locale, className }: { expiresAt: string | null; locale: string; className?: string }) {
  const text = textFor(locale);
  const { state, daysLeft } = certificateStatus(expiresAt);
  const date = expiresAt ? formatCertificateDate(expiresAt, locale, getAppDateTimeConfig().timeZone) : "";
  const label =
    state === "none"
      ? text.none
      : state === "ok"
        ? text.ok(date)
        : state === "expiring"
          ? text.expiring(date)
          : state === "urgent"
            ? text.urgent(daysLeft ?? 0)
            : text.expired(date);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[13px] font-semibold", TONE[state], className)}>
      <HeartPulse size={14} aria-hidden="true" className="shrink-0" />
      <span className="tabular">{label}</span>
    </span>
  );
}

/**
 * "Certificato medico presentato": submission day (today by default) and expiry
 * (submission + 365 days, following the submission day until changed by hand).
 */
export function MedicalCertificateDialog({
  open,
  onOpenChange,
  locale,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  user: { id: string; name: string; submittedAt: string | null; expiresAt: string | null } | null;
}) {
  const text = textFor(locale);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{user ? text.description(user.name) : null}</DialogDescription>
        </DialogHeader>
        {user ? <CertificateForm key={user.id} locale={locale} user={user} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function CertificateForm({
  locale,
  user,
  onDone,
}: {
  locale: string;
  user: { id: string; name: string; submittedAt: string | null; expiresAt: string | null };
  onDone: () => void;
}) {
  const text = textFor(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submittedOn, setSubmittedOn] = useState(() => appDateKey(new Date()));
  const [expiresOn, setExpiresOn] = useState(() => defaultCertificateExpiryKey(appDateKey(new Date())));
  const [expiryTouched, setExpiryTouched] = useState(false);
  const timeZone = getAppDateTimeConfig().timeZone;

  function run(kind: "save" | "clear") {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("id", user.id);
    formData.set("submittedOn", submittedOn);
    formData.set("expiresOn", expiresOn);
    startTransition(async () => {
      const result = kind === "save" ? await recordMedicalCertificateAction(formData) : await clearMedicalCertificateAction(formData);
      if (result.ok) {
        toast.success(result.message);
        onDone();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        run("save");
      }}
    >
      {user.submittedAt && user.expiresAt ? (
        <p className="text-[15px] text-[var(--muted-foreground)]">
          {text.current(formatCertificateDate(user.submittedAt, locale, timeZone), formatCertificateDate(user.expiresAt, locale, timeZone))}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="certificate-submitted">{text.submitted}</Label>
          <Input
            id="certificate-submitted"
            type="date"
            required
            value={submittedOn}
            onChange={(event) => {
              setSubmittedOn(event.target.value);
              if (!expiryTouched && event.target.value) setExpiresOn(defaultCertificateExpiryKey(event.target.value));
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="certificate-expires">{text.expires}</Label>
          <Input
            id="certificate-expires"
            type="date"
            required
            min={submittedOn}
            value={expiresOn}
            aria-describedby="certificate-expires-hint"
            onChange={(event) => {
              setExpiresOn(event.target.value);
              setExpiryTouched(true);
            }}
          />
          <p id="certificate-expires-hint" className="text-sm text-[var(--muted-foreground)]">{text.expiresHint}</p>
        </div>
      </div>
      <DialogFooter>
        {user.expiresAt ? (
          <Button type="button" variant="ghost" className="text-[var(--danger-fg)] sm:mr-auto" disabled={isPending} onClick={() => run("clear")}>
            {text.remove}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" disabled={isPending} onClick={onDone}>
          {text.cancel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? text.saving : text.save}
        </Button>
      </DialogFooter>
    </form>
  );
}
