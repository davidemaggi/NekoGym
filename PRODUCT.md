# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences with equal weight:

- **Trainees** (gym members): book, cancel, and follow their lessons mostly from a phone, often from the installed PWA. Short sessions: "what's on this week, is there a seat, book it".
- **Staff** (admins and trainers): run the gym from desktop or tablet: courses and weekly schedules, lessons, attendees, waitlists, pending approvals, attendance/no-show, users and plans, reports, notifications, site settings.

Members range widely in age, older people included.

## Product Purpose

NekoGym is a management platform for small gyms that run scheduled group courses. It turns a course's weekly schedule into bookable lessons, enforces each member's plan and access rules, keeps waitlists moving, and notifies everyone affected when something changes. Success means members book in seconds without calling the gym, and staff no longer reconcile bookings, plans, and cancellations by hand.

## Positioning

A product that serves several gyms: each installation sets its own name, logo, contacts, opening days, and closures from the site settings. "NekoGym" is the product name; the gym's own brand comes first in the interface.

## Operating Context

- Three roles: `ADMIN`, `TRAINER`, `TRAINEE`. Each sees a different menu.
- Localized UI (`it` / `en`), all routes live under `/{locale}/…`. Italian is the primary language.
- Dates and times follow the gym time zone (`APP_DATETIME_TIMEZONE`, default `Europe/Rome`).
- Notifications reach people by email, Telegram, Web Push, and an in-app inbox.
- Self-hosted with Docker, single process (Next.js custom server plus background jobs), SQLite.

## Capabilities and Constraints

- Courses: name, description, lesson type, trainer, duration, max attendees, booking advance window (months), cancellation window (hours), weekly slots. Future lessons are reconciled automatically from the course (see AGENTS.md, safety-critical).
- Lessons: generated or standalone, cancel/restore, attendees, pending approvals, waitlist, broadcast message, attendance (`PRESENT` / `NO_SHOW`) after the lesson ends.
- Plans: `FIXED` (lesson count), `WEEKLY`, `MONTHLY`; trial period; membership active/inactive; per-lesson-type access (`DENIED`, `REQUIRES_CONFIRMATION`, `ALLOWED`).
- Reports with PDF export and an email digest; backup/restore/reset behind TOTP in the Danger Zone.
- Auth: password, email OTP (6 digits), magic link, optional TOTP 2FA. Custom implementation, not NextAuth.
- Stack: Next.js 16 App Router, React 19, Tailwind CSS 4, Radix primitives with in-house shadcn-style components (`components/ui`), lucide icons, Recharts, sonner toasts.
- Light and dark theme are both required.

## Brand Commitments

- The gym name and logo are configurable per installation (SVG logo from site settings). The interface must look right with any gym's logo and name, not just the NekoGym cat.
- Lesson types carry their own admin-chosen color and SVG icon (`public/icons/lessontypes`), which the interface must render faithfully next to its own palette.
- Tone requested by the owner: simple, elegant, pastel colors.

## Evidence on Hand

- Default logo: `public/logo-nekogym.svg` (embedded raster).
- No testimonials, customers, or metrics exist; do not invent any.

## Product Principles

1. **Booking first.** For a member, the shortest path to "I'm booked" beats everything else on the screen.
2. **No surprises.** Every rule that blocks an action (full lesson, plan used up, cancellation window closed) is stated plainly where it applies, before the member tries.
3. **The gym's brand, not ours.** The product frames each installation's identity; it does not compete with it.
4. **Calm operations.** Staff screens are dense but quiet: state is legible at a glance, destructive actions are deliberate.

## Accessibility & Inclusion

Broad audience including older members: WCAG 2.2 AA contrast as a floor, readable body text (never below 16px on mobile for primary content), generous touch targets (at least 44px), no meaning conveyed by color alone (lesson-type colors always paired with name/icon), full keyboard support, respect for `prefers-reduced-motion`.
