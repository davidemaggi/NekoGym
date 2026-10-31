import Link from "next/link";

import { StatusScreen, statusPrimaryLinkClass } from "@/components/layout/status-screen";

// Unmatched URLs outside the app area: there is no locale to read, so Italian (the default) with a way home.
export default function NotFound() {
  return (
    <StatusScreen
      figure="404"
      title="Pagina non trovata"
      body="L'indirizzo non esiste o è stato spostato. Torna alla Home e riparti da lì."
    >
      <Link href="/" className={statusPrimaryLinkClass}>
        Torna alla Home
      </Link>
    </StatusScreen>
  );
}
