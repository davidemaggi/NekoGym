<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Structure

NekoGym is a Next.js 16 project using the App Router pattern. Key directories:
- `app/` — Next.js app directory with layouts, pages, and server components
- `public/` — Static assets
- Root-level configuration files for Next.js, TypeScript, ESLint, PostCSS, and Tailwind

## Technology Stack

- **Next.js 16.2.2** — React framework with App Router, SSR, and built-in optimizations
- **React 19.2.4** — Latest React with automatic JSX transform
- **TypeScript 5** — Type-safe development; `strict` mode enabled in `tsconfig.json`
- **Tailwind CSS 4** — Utility-first styling with `@tailwindcss/postcss`
- **shadcn/ui** — Component library for building accessible and customizable UI
- **ESLint 9** — Linting with flat config (`eslint.config.mjs`), Next.js rules, and TypeScript support
- **SQLite** — Lightweight relational database for storing gym data (users, courses, lessons, bookings)
- **Prisma** — ORM for database access and migrations
- **NextAuth.js** — Authentication and authorization for user management
- **Docker** — Containerization for consistent development and deployment environments
- **Notifications** via email (e.g., using Nodemailer) and/or Telegram Bot for lesson cancellations and rescheduling
- **PWA Support** — Configured for offline access and mobile-friendly experience
- **Passwordless Authentication** — Using email or telegram for secure and user-friendly login without passwords leveraging 6 digit codes NextAuth.js providers


## Development Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Run ESLint
```

## TypeScript & Path Aliases

- Path alias `@/*` maps to project root for clean imports: `import { Component } from "@/app/..."`
- TypeScript strict mode is enabled — all type errors must be resolved
- JSX is configured for automatic runtime (`jsx: "react-jsx"`)

## Styling & CSS

- Global styles in `app/globals.css`
- Tailwind CSS 4 with PostCSS integration
- Layout uses Tailwind utilities for responsive design (e.g., `sm:`, `md:` breakpoints)
- Fonts loaded via Next.js `next/font/google` for optimization
- shadcn/ui components styled with Tailwind and customizable via CSS variables (e.g., `--font-geist-sans`)
- fully responsive design with mobile-first approach, ensuring usability across devices
- support for dark mode using Tailwind's `dark:` variants and CSS media queries

## Linting & Code Quality

- ESLint config uses flat config API (`eslint.config.mjs`) with Next.js core-web-vitals and TypeScript presets
- Ignored paths: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run `npm run lint` before committing to catch issues early

## Key Conventions

- Server Components by default in the `app/` directory; use `"use client"` for client-side interactivity
- Metadata exported as `export const metadata: Metadata` in layout files
- Images imported via `next/image` with proper `width`, `height`, and `alt` attributes
- Font imports use `next/font/google` with variable CSS custom properties (e.g., `--font-geist-sans`)


## System Overview

This Application will manage a small gym, an admin will be able to create other user, which might be traners or trainee.
So i need three kind of users, Admin, Trainer, Trainee.

Admins and Trainer can manage courses and lessons. a courses.

A Course has a Name, a Description, an Icon, a Duration(In minutes), the max number of attendees(aka trainee),  and a trainer. But a course is essentially a scedule, for each day of the week user can define one or more starting time and ending time will be automatically calculated. For example, a course can be scheduled for Monday from 8:00 to 9:00 and from 18:00 to 19:00, and on Wednesday from 8:00 to 9:00.
Each course will also defiine how many month in advance the trainee can book a lesson, for example if a course is defined with 2 months in advance, then trainee can only book lessons that are scheduled within the next 2 months.

Admin and Trainer can also manage lessons, a lesson is an instance of a course, it has a date and time, and a list of attendees(trainee). Admin and Trainer can also cancel a lesson, in this case all the attendees will be notified. Lessons can also be rescheduled, in this case all the attendees will be notified as well. A lesson can be cancelled or rescheduled up to 24 hours before the scheduled time, after that it cannot be cancelled or rescheduled anymore, if the lesson is linked to a course this 24hr will be a parameter at course level.

Trainee can book a lesson, but only if the lesson is not full and if the trainee has not already booked a lesson for that course on the same day. Trainee can also cancel a booking, but only up to 24 hours before the scheduled time of the lesson. Each time a trainee books or cancels a lesson, the trainer will be notified. A trainee can also be put on a waiting list for a lesson that is full, in this case if a spot opens up the trainee will be notified and can book the lesson. Each Trainee has a profile with their name, email, and phone number. Trainee can also have a membership status, which can be active or inactive. Only active members can book lessons, Active Trainee have subscription Plans, which can be monthly(number of lessons x month) or weekly(number of lessons x week), or fixed number of lessons, for example 10 lessons. Each time a trainee books a lesson, the number of remaining lessons in their subscription plan will be decremented by one, if the trainee has a fixed number of lessons and they have no more remaining lessons, they cannot book any more lessons until they purchase a new subscription plan. If Monthly or weekly subscription plan, the trainee can book lessons until the end of the month or the week, and at the end of the month or the week, the number of remaining lessons will be reset to the number of lessons defined in the subscription plan.

There is no actual purchase, it's the admin that will set the subscription plan for each trainee, and will also set the membership status to active or inactive. Admin can also set a trial period for each trainee, during the trial period the trainee can book lessons without having an active membership status or a subscription plan, but after the trial period ends the trainee will need to have an active membership status and a subscription plan to book lessons.

An Admin can also generate reports, for example a report of the number of attendees for each course, or a report of the revenue generated by each course, or a report of the most popular courses.
An Admin can also manage the gym's schedule, for example they can block certain days or times when the gym is closed, in this case no lessons can be scheduled during those times.
An Admin can also manage the gym's trainers, for example they can assign a trainer to a course, or they can remove a trainer from a course, or they can set the availability of a trainer, in this case lessons can only be scheduled during the trainer's availability.
An Admin can also manage the gym's trainees, for example they can activate or deactivate a trainee's membership status, or they can set a trial period for a trainee, or they can set a subscription plan for a trainee.
A trainee can signup for an account, but they cannot book lessons until an admin activates their membership status and sets a subscription plan for them. An admin can also manually activate a trainee's account and set a subscription plan for them, without the trainee having to sign up for an account.