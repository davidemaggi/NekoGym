"use client";

import "./globals.css";

import { StatusScreen, statusPrimaryLinkClass } from "@/components/layout/status-screen";

// The root layout itself failed: this replaces it, so it brings its own document and styles.
// Theme follows the OS here (no app-level toggle reaches this page).
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="it">
      <body className="min-h-full bg-background text-foreground antialiased">
        <title>NekoGym</title>
        <StatusScreen
          title="Qualcosa non ha funzionato"
          body="L'app non si è caricata. Riprova tra qualche istante: se succede ancora, avvisa chi gestisce la palestra."
        >
          <button type="button" onClick={() => retry()} className={statusPrimaryLinkClass}>
            Riprova
          </button>
        </StatusScreen>
      </body>
    </html>
  );
}
