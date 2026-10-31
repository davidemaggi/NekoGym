"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { StatusBody, statusPrimaryLinkClass } from "@/components/layout/status-screen";

/** A missing lesson, user or page inside the app: the shell stays, so navigation is one tap away. */
export default function AppNotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "en" ? "en" : "it";
  const isIt = locale === "it";

  return (
    <div className="py-12 lg:py-20">
      <StatusBody
        figure="404"
        title={isIt ? "Non trovato" : "Not found"}
        body={
          isIt
            ? "Quello che cerchi non c'è più o non è mai esistito: magari è stato eliminato o il link è vecchio."
            : "What you're looking for is gone or never existed: it may have been deleted, or the link is old."
        }
      >
        <Link href={`/${locale}`} className={statusPrimaryLinkClass}>
          {isIt ? "Torna alla Home" : "Back to Home"}
        </Link>
      </StatusBody>
    </div>
  );
}
