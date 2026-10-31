"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { StatusBody, statusPrimaryLinkClass, statusSecondaryClass } from "@/components/layout/status-screen";

/** Something failed while loading a page: say so plainly, offer to retry, keep the shell around it. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "en" ? "en" : "it";
  const isIt = locale === "it";
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-12 lg:py-20">
      <StatusBody
        title={isIt ? "Qualcosa non ha funzionato" : "Something went wrong"}
        body={
          isIt
            ? "La pagina non si è caricata. Riprova: se succede ancora, avvisa chi gestisce la palestra."
            : "The page didn't load. Try again: if it keeps happening, tell whoever runs the gym."
        }
      >
        <button type="button" onClick={() => retry()} className={statusPrimaryLinkClass}>
          {isIt ? "Riprova" : "Try again"}
        </button>
        <Link href={`/${locale}`} className={statusSecondaryClass}>
          {isIt ? "Torna alla Home" : "Back to Home"}
        </Link>
      </StatusBody>
      {digest ? (
        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          {isIt ? "Codice errore" : "Error code"}: <span className="font-mono">{digest}</span>
        </p>
      ) : null}
    </div>
  );
}
