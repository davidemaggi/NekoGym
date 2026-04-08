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
- Telegram bot bootstrap hook (enabled when `TELEGRAM_BOT_TOKEN` is set)

Environment variables:

- `LESSON_RECONCILE_DAILY_AT` (default `03:00`)
- `LESSON_RECONCILE_RUN_ON_STARTUP` (`true`/`false`)
- `TELEGRAM_BOT_TOKEN`

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

