# NekoGym

Base application for gym management built with Next.js App Router.

## Features implemented

- Sidebar layout with role-based menu visibility
- Internationalization routing with `it` and `en` locales (`/[locale]/...`)
- Auth with Prisma + SQLite (register, login, logout)
- First registered user is automatically assigned role `ADMIN`

## Tech stack

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Prisma + SQLite

## Setup

1. Install dependencies
2. Configure environment
3. Run Prisma migration
4. Start dev server

```bash
npm install
cp .env.example .env
npm run prisma:migrate -- --name init
npm run dev
```

## Useful commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
```

## Custom server

- The app runs with a custom Node server (`server/custom-server.ts`)
- It starts Next.js request handling and background services in the same process
- In development you can still use plain Next with `npm run dev:next`

### Local HTTPS (recommended for iOS Web Push tests)

For iOS Web Push, run the custom server in HTTPS and open the app from Home Screen.

Set these env vars in `.env`:

```dotenv
DEV_HTTPS="true"
DEV_HTTPS_STRICT="true"
DEV_HTTPS_CERT_FILE="/absolute/path/to/cert.pem"
DEV_HTTPS_KEY_FILE="/absolute/path/to/key.pem"
DEV_HTTPS_PASSPHRASE="" # optional
APP_URL="https://your-hostname:3000"
```

Then start as usual:

```bash
npm run dev
```

If `DEV_HTTPS_STRICT="false"`, the server falls back to HTTP when cert loading fails.

## Docker

The container runs `npm run start`, which starts the custom server. That single process serves Next.js pages and keeps background services alive (daily lessons reconcile + Telegram bootstrap).

Start everything:

```bash
docker compose up --build -d
```

Follow logs:

```bash
docker compose logs -f nekogym
```

Stop:

```bash
docker compose down
```

## Background services

- Daily lessons reconcile job (in-process scheduler)
- Notification outbox worker (email always + Telegram when linked)
- Web Push delivery for users with active browser subscription
- Telegram bot bootstrap hook (enabled when `TELEGRAM_BOT_TOKEN` is set)

Environment variables:

- `LESSON_RECONCILE_DAILY_AT` (default `03:00`)
- `LESSON_RECONCILE_RUN_ON_STARTUP` (`true`/`false`)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME` (without `@`, used to generate QR/deep link)
- `OUTBOX_POLL_MS` (default `4000`)
- `APP_URL` (base URL used in email links, e.g. `http://localhost:3000`)
- `SMTP_HOST`
- `SMTP_PORT` (default `587`)
- `SMTP_AUTH_ENABLED` (`true`/`false`)
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `WEB_PUSH_VAPID_SUBJECT` (e.g. `mailto:admin@example.com`)
- `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`
- `WEB_PUSH_VAPID_PRIVATE_KEY`

Generate VAPID keys:

```bash
npm run webpush:vapid
```

Copy the printed keys into `.env`:

```dotenv
NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY="..."
WEB_PUSH_VAPID_PRIVATE_KEY="..."
WEB_PUSH_VAPID_SUBJECT="mailto:admin@example.com"
APP_URL="http://localhost:3000"
```

Telegram bot commands:

- `/link <32-char-code>` to link Telegram chat with a NekoGym user
- `/myLessons` to list today's lessons + next 7 days where user is booked or assigned as trainer
- QR in profile settings is generated locally by `GET /api/telegram/link/qr` (no external QR service)

## Notifications

- Outbox pattern backed by `NotificationOutbox` table
- Manual admin notifications at `/[locale]/settings/notifications`
- Audience can be all users, only trainers, or only trainees
- Each queued notification creates:
  - one `EMAIL` outbox entry (always)
  - one `TELEGRAM` outbox entry only when user has linked Telegram chat id
- one `WEBPUSH` outbox entry only when user has at least one active Web Push subscription
    - SMTP and Telegram infrastructure settings are read from environment variables only
    - In `/[locale]/settings/site` you can see readonly values and run test send for Email/Telegram

## PWA + Web Push (dev test)

Prerequisites:

- `.env` configured with VAPID keys (see above)
- SMTP configured if you also want to test email verification/reset links

Run app:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Test PWA install banner:

1. Open `http://localhost:3000/it` (or `/en`) and login.
2. In authenticated area, check the install banner.
3. Click `Install` and verify the app appears as installed (browser dependent).

Test Web Push subscription:

1. Go to profile settings (`/[locale]/settings/profile`).
2. In "Web push notifications", click enable and allow browser permission.
3. Verify status becomes enabled.

Test outbox `WEBPUSH` delivery:

1. As admin, open `/[locale]/settings/notifications`.
2. Send a manual notification to an audience that includes your user.
3. In outbox filters, set channel to `WEBPUSH` and verify entries.
4. Keep browser open/backgrounded and check push notification arrival.

If delivery fails, inspect outbox errors and retry from the same page.

## Email verification and password flows

- New registrations require email verification before login.
- Users created by admin receive verification email too.
- Admin can still mark email as verified manually.
- Until email is verified, users cannot login and standard notifications are blocked.
- User email change is pending until new address is confirmed via link.
- Password can be changed from profile, and reset via forgot/reset pages.

## Auth flow

- Open `/it/register` (or `/en/register`) to create an account
- If DB is empty, this first user becomes `ADMIN`
- Next users are created as `TRAINEE` by default
- Login at `/it/login` or `/en/login`

## Notes

- Locale redirect is handled via `proxy.ts`
- Session is stored in SQLite (`Session` table) and cookie `neko_session`

## Daily lesson reconciliation (cron)

- Endpoint: `POST /api/cron/lessons/reconcile` (optional manual/external trigger)
- Auth: header `x-cron-secret: $CRON_SECRET` (or `Authorization: Bearer $CRON_SECRET`)
- Purpose: iterate all courses and generate/update/cancel future lessons when needed

```bash
curl -X POST "http://localhost:3000/api/cron/lessons/reconcile" \
  -H "x-cron-secret: $CRON_SECRET"
```

