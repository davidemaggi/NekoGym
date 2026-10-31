---
version: 1
slug: "app-locale-app-bookings-page-tsx"
primary_target: "app/[locale]/(app)/bookings/page.tsx"
related_targets: ["app/[locale]/(app)/layout.tsx","components/layout/app-sidebar.tsx","app/globals.css"]
---

# Bookings (trainee) — first surface of the NekoGym redesign

Mode: Operate. This surface sets the world for the whole app shell; staff screens inherit it.

Audience and job: members of any age, mostly on a phone (PWA), book or cancel a lesson in seconds and understand why an action is blocked (full, plan used up, cancellation window closed). Staff use the same screen (and its staff views) from desktop/tablet.

Constraints: navigation may be reorganized (bottom bar on mobile allowed); all functions and role menus stay. Avoid: aggressive fitness look, childish pastels, anonymous admin grey. WCAG AA, 44px targets, 16px+ primary text, light + dark.

## Direction contract

THESIS: Booking is validating a ticket. The member's plan is their season pass, every booked lesson carries the violet validator stamp. Refuses the white-card SaaS list with one teal button.

OWN-WORLD: Italian transit-pass stocks as section grounds (mint, rosa, giallino, lilla, azzurro paper tints), deep night-blue ink, one reserved stamp violet used only for the user's own bookings. Archivo with condensed widths for tabular times and counts, normal width for text. Dashed perforation line as the only ornament. Flat, no gradients or glass.

STORY: The member sees how many entries remain, picks a day, scans times in a fixed column, books with one tap and sees the stamp land; blocked rows say why in place.

FIRST VIEWPORT: Mobile: section-tinted header with gym name and the pass card (plan type, remaining count large, entry slots, expiry). Day strip below. Day list: fixed 62px time column, lesson with type dot, trainer and seats, right column holds Prenota / stamp / queue. Bottom tab bar. Desktop: same shell as a left rail, pass card top of the content column, week visible.

FORM: Abbonamento (transit season pass and validator stamp), candidate 7 of 7 on the grounded list. seed:ac8c71e5b493775a. Raises: fixed time rows with in-place state (split-flap); one paper stock per section tinting the current header (acetate tab board); type carries hierarchy, chrome removed (metro tiles); stamp violet reserved for own bookings (orienteering); one lesson opens in place with its rules while others quiet (streaming wall).

Signature interaction: tapping Prenota prints the stamp into the row (short press-and-settle, no bounce, reduced-motion: instant). Motion grammar: 120–180ms ease-out, state changes in place, never reorder.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
