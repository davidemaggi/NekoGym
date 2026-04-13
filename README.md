# NekoGym

Applicazione web per la gestione operativa di una palestra (corsi, lezioni, prenotazioni, no-show, notifiche, report e amministrazione dati), costruita con Next.js App Router e Prisma/SQLite.

## 1. Panoramica funzionale

NekoGym supporta 3 ruoli:

- `ADMIN`
- `TRAINER`
- `TRAINEE`

La UI è localizzata (`it` / `en`) e tutte le pagine applicative vivono sotto `/{locale}/...`.

Menu per ruolo:

- `ADMIN`: dashboard, corsi, lezioni, prenotazioni, utenti, report, notifiche personali, impostazioni profilo, impostazioni sito, registri (tipi lezione), notifiche manuali, danger zone.
- `TRAINER`: dashboard, corsi (solo propri), lezioni (solo proprie), prenotazioni, notifiche personali, impostazioni profilo, registri.
- `TRAINEE`: dashboard, prenotazioni, notifiche personali, impostazioni profilo.

## 2. Flussi principali per l’utente

## 2.1 Autenticazione e sicurezza

Accessi disponibili in login:

- password classica
- OTP di login (codice a 6 cifre)
- magic link via email

Funzionalità aggiuntive:

- verifica email obbligatoria dopo registrazione
- resend verifica email
- reset password (forgot/reset)
- 2FA TOTP opzionale (abilitabile dal profilo)

Regola bootstrap:

- il primo utente registrato nel DB diventa automaticamente `ADMIN`.

## 2.2 Dashboard

La dashboard mostra:

- KPI sintetici (corsi attivi, lezioni del giorno, prenotazioni future)
- widget richieste pendenti (admin/trainer)
- calendario/insights lezioni personali
- grafico affollamento (admin/trainer): media presenze per fascia oraria sul giorno settimana selezionato (default oggi), con navigazione giorno precedente/successivo

## 2.3 Corsi

Un corso contiene:

- nome, descrizione, icona
- tipo lezione
- trainer assegnato
- durata, max partecipanti
- finestra prenotazione anticipata (`bookingAdvanceMonths`)
- finestra minima cancellazione (`cancellationWindowHours`)
- schedulazione settimanale (slot giorno+orario)

Regole principali:

- trainer può creare/modificare/eliminare/ripristinare solo corsi assegnati a lui
- trainer può assegnare solo sé stesso
- schedule validata (niente overlap nello stesso giorno)
- schedule vincolata ai giorni apertura palestra

Quando un corso cambia, parte la **reconcile** delle lezioni future generate (sezione dedicata più sotto).

## 2.4 Lezioni

Pagine staff:

- `/lessons` per gestione operativa (admin/trainer)
- toggle `Mostra/Nascondi passate` (default: nascoste)
- admin può anche mostrare/nascondere eliminate

Operazioni disponibili:

- creare lezione standalone (non legata a corso)
- modificare/cancellare/ripristinare standalone
- aprire dettaglio lezione con tab `Informazioni` + `Persone`
- gestire iscritti, pending approvals, waitlist
- inviare messaggi broadcast agli iscritti della lezione

Regole su lezioni passate:

- per lezioni passate/in corso, la parte `Informazioni` è read-only
- resta modificabile solo la parte `Persone` (aggiunte/rimozioni/presenze)

Cancellazione da lista lezioni:

- usa dialog di conferma shadcn
- submit server action diretto

## 2.5 Presenze e no-show

Ogni prenotazione confermata può avere stato presenza:

- `PRESENT`
- `NO_SHOW`
- `null` (non marcata)

Regole:

- solo admin/trainer della lezione possono segnare presenza/no-show
- segnatura consentita dopo la fine della lezione
- segnare `NO_SHOW` invia notifica al trainee
- in lezioni passate si può aggiungere/rimuovere persone:
  - aggiunta in passato: nessuna notifica
  - rimozione in passato: notifica al trainee

Automazione:

- job automatico marca `PRESENT` tutte le prenotazioni confermate non marcate di lezioni concluse entro fine giornata precedente
- admin/trainer possono correggere successivamente (anche impostando no-show)

## 2.6 Prenotazioni (trainee + vista staff)

Regole booking:

- solo lezioni `SCHEDULED`, non eliminate, non iniziate
- no doppia prenotazione stesso corso nello stesso giorno
- rispetto membership/trial/subscription
- accessi per tipo lezione (`DENIED`, `REQUIRES_CONFIRMATION`, `ALLOWED`)

Sezione piani:

- `FIXED`: decremento `subscriptionRemaining` alla conferma, rimborso su disiscrizione valida
- `WEEKLY`/`MONTHLY`: limite prenotazioni nella finestra corrispondente
- trial attivo bypassa membership inattiva
- subscription scaduta può forzare membership a inattiva

Waitlist:

- se lezione piena, utente va in coda
- liberando posto, promozione automatica del primo in coda
- notifiche a utente promosso + staff

Pending approvals:

- se tipo lezione richiede conferma, booking entra in `PENDING`
- admin/trainer della lezione può confermare/rifiutare
- solo admin può “confermare con accesso libero” (apre accesso tipo lezione)

## 2.7 Utenti (solo admin)

Gestione completa utenti:

- creazione, modifica, eliminazione
- ruolo (`ADMIN`, `TRAINER`, `TRAINEE`)
- stato membership/trial
- configurazione piano subscription
- verifica email manuale
- matrice accesso per tipo lezione

Effetti automatici:

- se un trainee viene impostato `DENIED` su un tipo lezione, le sue prenotazioni future di quel tipo vengono revocate
- invio notifica informativa all’utente in caso di cambi accessi

## 2.8 Report (solo admin)

Pagina `/reports` con:

- KPI + trend vs periodo precedente
- snapshot executive
- tabelle:
  - popolarità corsi
  - orari più affollati
  - performance trainer
  - analytics no-show
- grafico salute corsi (riempimento vs no-show)

Export PDF:

- `/{locale}/reports/export?days=...`
- layout report con header, tabelle leggibili, zebra rows e paginazione

Invio report automatici via email:

- frequenza: `NEVER`, `WEEKLY`, `MONTHLY`
- selezione report inclusi
- invio solo ad admin con email verificata e `notifyByEmail=true`

## 2.9 Notifiche

Canali supportati:

- email
- Telegram
- Web Push
- notifiche locali in-app (sempre registrate)

Preferenze utente:

- toggle canale email/telegram/webpush
- retention notifiche locali (giorni)

Pagine:

- `my-notifications`: inbox personale locale con delete singolo/totale
- `settings/notifications` (admin): invio manuale a audience + monitor outbox + retry singolo/multiplo

Comportamento notifiche (alto livello):

- trainee viene notificato se cambia qualcosa che lo riguarda direttamente (es. rimozione, no-show, approvazione/rifiuto, lezione aggiornata/cancellata)
- cambi non rilevanti per gli altri iscritti (es. altri utenti che si iscrivono) non generano broadcast generale
- trainer riceve eventi relativi alle proprie lezioni
- admin riceve visibilità completa tramite outbox e flussi staff

## 2.10 Impostazioni

### Profilo (`/settings/profile`)

- sicurezza account: cambio password, cambio email con verifica
- 2FA TOTP setup/disable
- collegamento Telegram (codice + deep link + QR)
- web push subscribe/unsubscribe + test
- preferenze canali notifica

### Sito (`/settings/site`, admin)

Tab:

- General: nome palestra, logo SVG, giorno reset piano settimanale
- Contacts: indirizzo/email/telefono
- Notifications: stato configurazione SMTP/Telegram da env + test invio
- Schedule: giorni apertura e date chiusura (usate da planning/reconcile)

### Registri (`/settings/registries`, admin/trainer)

- gestione tipi lezione (nome, descrizione, icona, colore)

### Danger Zone (`/settings/danger-zone`, admin)

Tab:

- `Backup`: crea backup DB, carica backup esterno, lista backup
- `Restore`: ripristino backup con OTP
- `Reset`: reset dati applicativi con conferma + OTP

Sicurezze:

- dialog di conferma shadcn (non `window.confirm`)
- bottoni restore/reset disabilitati finché campi obbligatori non sono compilati

Nella lista backup:

- `Scarica` backup
- `Cancella` backup con conferma

## 3. Regole business critiche (Course -> Lessons reconcile)

Quando un corso viene creato/aggiornato/ripristinato, NekoGym allinea le lezioni future generate.

Trigger:

- `createCourseAction`
- `updateCourseAction`
- `restoreCourseAction`
- job giornaliero di reconcile

Outcomes per lezione:

- `modified`: lezione aggiornata ai valori del corso
- `unchanged`: già allineata
- `cancelled`: non eliminabile silenziosamente (es. con iscritti)
- `deleted`: rimossa/cancellata senza iscritti
- `created`: seed mancante creato

Vincoli:

- solo lezioni future `isGenerated=true` e non eliminate
- `isCustomized=true` trattate separatamente
- filtri su schedule palestra (giorni aperti/date chiuse)
- notifiche inviate per cancellazioni automatiche di lezioni con iscritti
- log server dettagliati per ogni decisione reconcile (id, startsAt, outcome, reason)

## 4. Automazioni server (background jobs)

Avviate dal custom server nello stesso processo applicativo:

- reconcile giornaliera lezioni future (`LESSON_RECONCILE_*`)
- auto-cancel notice window (`LESSON_NOTICE_WINDOW_POLL_MS`)
- auto-conferma presenze a fine giornata (`LESSON_ATTENDANCE_AUTOCONFIRM_INTERVAL_MS`)
- pulizia notifiche locali in base a retention utente (`LOCAL_NOTIFICATIONS_CLEANUP_INTERVAL_MS`)
- digest report via email (`REPORT_DIGEST_*`)
- worker outbox notifiche (`OUTBOX_POLL_MS`)
- bootstrap bot Telegram

## 5. Stack tecnico

- Next.js `16.2.2` (App Router)
- React `19.2.4`
- TypeScript `5`
- Tailwind CSS `4`
- Prisma `7` + SQLite
- shadcn/ui + Radix
- Recharts
- Nodemailer, Web Push, Telegram bot integration

## 6. Setup locale

Prerequisiti:

- Node.js 20+
- npm

Installazione:

```bash
npm install
cp .env.example .env
npm run dev
```

All’avvio del custom server:

- crea `./data` e `./data/backups` se mancanti
- esegue `prisma migrate deploy`
- avvia Next + background jobs

Cartelle dati:

- `./data/nekogym.db`
- `./data/backups`

## 7. Comandi utili

```bash
npm run dev            # custom server + jobs (dev)
npm run dev:next       # solo Next.js dev server
npm run build
npm run start          # custom server in prod
npm run start:next     # solo next start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run webpush:vapid
```

## 8. Docker

Il container usa il custom server (`npm run start`), quindi include anche i background services.

```bash
docker compose up --build -d
docker compose logs -f nekogym
docker compose down
```

## 9. Variabili ambiente

Base (vedi `.env.example`):

- `CRON_SECRET`
- `APP_URL`
- `APP_DATETIME_LOCALE`
- `APP_DATETIME_TIMEZONE`
- `NEXT_PUBLIC_APP_DATETIME_LOCALE`
- `NEXT_PUBLIC_APP_DATETIME_TIMEZONE`

Reconcile / jobs:

- `LESSON_RECONCILE_DAILY_AT` (default `03:00`)
- `LESSON_RECONCILE_RUN_ON_STARTUP`
- `LESSON_NOTICE_WINDOW_POLL_MS`
- `LESSON_ATTENDANCE_AUTOCONFIRM_INTERVAL_MS`
- `LOCAL_NOTIFICATIONS_CLEANUP_INTERVAL_MS`
- `REPORT_DIGEST_DAILY_AT` (default `08:00`)
- `REPORT_DIGEST_LOCALE` (`it`/`en`)
- `REPORT_DIGEST_RUN_ON_STARTUP`

Notifiche:

- `OUTBOX_POLL_MS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_AUTH_ENABLED`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `WEB_PUSH_VAPID_SUBJECT`
- `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`
- `WEB_PUSH_VAPID_PRIVATE_KEY`

Auth OTP rate limiting:

- `AUTH_OTP_REQUEST_WINDOW_MS`
- `AUTH_OTP_REQUEST_MAX_PER_USER`
- `AUTH_OTP_REQUEST_MAX_PER_IP`
- `AUTH_OTP_VERIFY_WINDOW_MS`
- `AUTH_OTP_VERIFY_MAX_FAILURES_PER_USER`
- `AUTH_OTP_VERIFY_MAX_FAILURES_PER_IP`

Dev HTTPS (test iOS Web Push):

- `DEV_HTTPS`
- `DEV_HTTPS_STRICT`
- `DEV_HTTPS_CERT_FILE`
- `DEV_HTTPS_KEY_FILE`
- `DEV_HTTPS_PASSPHRASE`

## 10. API/endpoint operativi

- `POST /api/cron/lessons/reconcile`
  - auth con `x-cron-secret` o `Authorization: Bearer`
- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`
- `GET /api/local-notifications/summary`
- `GET /api/telegram/link/qr`

Esempio reconcile manuale:

```bash
curl -X POST "http://localhost:3000/api/cron/lessons/reconcile" \
  -H "x-cron-secret: $CRON_SECRET"
```

## 11. Note operative importanti

- Le policy più sensibili (reconcile, cancellazioni automatiche, no-show, notifiche) sono governate da server actions + job schedulati.
- Le pagine staff usano controlli role-based server-side, non solo client-side.
- Le operazioni distruttive in danger zone richiedono 2FA OTP.

