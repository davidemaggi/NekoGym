---
name: NekoGym
description: Booking a lesson is validating a ticket. Transit-pass paper stocks, night-blue ink, and one reserved stamp violet.
colors:
  ink: "#1f2340"
  ink-hover: "#2e3360"
  ground: "#f5f6f8"
  surface: "#ffffff"
  surface-sunken: "#eef0f4"
  surface-border: "#dde1e9"
  rule: "#e6e9ef"
  muted: "#eceef3"
  muted-ink: "#555a78"
  sidebar-link: "#3c4163"
  stock-mint: "#dcefe3"
  stock-azzurro: "#dceaf6"
  stock-giallino: "#f4ecc6"
  stock-rosa: "#f6dfe3"
  stock-lilla: "#e5dff3"
  stock-carta: "#e9ecf2"
  stamp: "#5b3fa0"
  stamp-soft: "#ece6f8"
  info-bg: "#dceaf6"
  info-fg: "#1d4a72"
  success-bg: "#dcefe3"
  success-fg: "#1f5a3c"
  warning-bg: "#f7edc8"
  warning-fg: "#6b4a00"
  danger-bg: "#f8e1e4"
  danger-fg: "#8c2236"
  destructive: "#a3293f"
  on-ink: "#ffffff"
  ink-dark: "#eceef8"
  ground-dark: "#12142a"
  surface-dark: "#1b1e37"
  rule-dark: "#272b4b"
  muted-ink-dark: "#aeb3d0"
  stock-mint-dark: "#1d3a30"
  stock-azzurro-dark: "#1d3048"
  stock-giallino-dark: "#3a3320"
  stock-rosa-dark: "#3e2632"
  stock-lilla-dark: "#2d2749"
  stock-carta-dark: "#22264a"
  stamp-dark: "#bba8f2"
  destructive-dark: "#e07a8c"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.25
    fontVariation: "'wdth' 100"
  figure:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0"
    fontFeature: "'tnum' 1, 'lnum' 1"
    fontVariation: "'wdth' 74"
  time:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0"
    fontFeature: "'tnum' 1, 'lnum' 1"
    fontVariation: "'wdth' 74"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  input:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  stamp-lettering:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    letterSpacing: "0.08em"
  code:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 400
rounded:
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  hairline: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  row-y: "14px"
  gutter: "16px"
  card: "20px"
  gutter-sm: "24px"
  gutter-lg: "40px"
  target: "44px"
  tab: "60px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.xl}"
    height: "44px"
  button-sm:
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.input}"
    rounded: "{rounded.xl}"
    padding: "0 14px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.card}"
  pass-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.card}"
  pass-card-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-fg}"
  stamp-face:
    textColor: "{colors.stamp}"
    typography: "{typography.stamp-lettering}"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
    width: "108px"
  badge-neutral:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "2px 8px"
  badge-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success-fg}"
    rounded: "{rounded.lg}"
    padding: "2px 8px"
  badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-fg}"
    rounded: "{rounded.lg}"
    padding: "2px 8px"
  badge-danger:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger-fg}"
    rounded: "{rounded.lg}"
    padding: "2px 8px"
  day-chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.xl}"
    height: "60px"
  nav-link-active:
    backgroundColor: "{colors.stock-mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 12px"
    height: "44px"
  bottom-tab-active-pill:
    backgroundColor: "{colors.stock-mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    width: "56px"
    height: "32px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.3xl}"
    padding: "20px"
  tabs-list:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.xl}"
    padding: "4px"
  tabs-trigger-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "36px"
---

# Design System: NekoGym

## Overview

**Creative North Star: "Abbonamento"**

NekoGym is an Italian transit season pass. Every section of the app is printed on its own paper stock (mint, azzurro, giallino, rosa, lilla, carta), the ink is a deep night blue, and the only coloured mark that ever belongs to the member is the violet validator stamp on the lessons they have booked. Booking a lesson is validating a ticket: the member reads how many entries are left on their pass, picks a day, scans times set in a fixed column like a departures board, and taps once to watch the stamp land in the row.

The system is flat and paper-like. Type carries hierarchy; chrome is removed. Times, counts and dates are set in Archivo's condensed width with tabular figures, as if printed on a ticket; text runs at normal width. A dashed perforation line is the single ornament, and it carries meaning too: dashed means provisional (pending approval, queued, waitlist). State changes happen in place and rows never reorder. The pastel stocks answer the owner's request for "simple, elegant, pastel" without becoming childish, because they sit under firm night-blue ink and are only ever grounds, never decoration.

The world frames each gym's own name and logo (configurable per installation) and renders admin-chosen lesson-type colours and icons faithfully beside its own palette. Light and dark are both first-class: in dark mode the stocks become deep tinted inks on a night ground and the stamp lightens to a pale violet.

Status of the build: the bookings surface, the app shell (rail, mobile top bar, bottom tab bar, menu sheet), the shared primitives in `components/ui`, the toaster and the Web Push banner are in the world. Dashboard, lessons, courses, users, settings and reports currently only inherit the tokens and primitives; their layouts are pre-redesign and are not part of this system. Do not copy their compositions as precedent.

**Key Characteristics:**
- One paper stock per section; the current stock tints the shell and the page header band.
- Night-blue ink for text and primary actions; never a neutral admin grey ground.
- One reserved violet stamp for the user's own bookings.
- Condensed tabular figures for every time, count and date.
- Dashed perforation as the only ornament, also meaning "provisional".
- Flat paper; lift only on the pass card, the opened row, the active tab, and overlays.
- 44px touch targets, 16px input text, bottom sheets on phones.

## Colors

A cool paper-and-ink palette: pale transit-pass stocks as grounds, night-blue ink, one saturated violet held in reserve.

### Primary
- **Night-Blue Ink** (`ink`): body text, headings, primary buttons, the selected day chip, outline-button strokes (1.5px). In dark mode it inverts to Pale Ink (`ink-dark`) on the night ground, and primary buttons become pale with night text.

### Secondary
- **Validator Violet** (`stamp`; dark `stamp-dark`): the stamp. Fills the used entry slots on the pass, draws the stamp face on booked rows, the own-booking dot under a day in the day strip, and the booked chips in the upcoming list. Its tint **Stamp Wash** (`stamp-soft`) is the hover behind a stamp button and the text-selection colour. The same violet is also the focus ring, text caret and native control accent: interaction affordances, not content marks.

### Tertiary: Ticket Stocks
- **Mint** (`stock-mint`): Prenotazioni (bookings).
- **Azzurro** (`stock-azzurro`): Lezioni.
- **Giallino** (`stock-giallino`): Corsi, Notifiche, Registri; also the Web Push banner's icon tile.
- **Rosa** (`stock-rosa`): Utenti, Danger Zone.
- **Lilla** (`stock-lilla`): Report, manual notifications; also the user-initials avatar.
- **Carta** (`stock-carta`): Dashboard, profile, site settings, and the fallback.

The shell resolves the current section to one stock (`STOCK_BY_KEY` in the app shell) and sets `data-stock` on the layout root; `--stock` then resolves to that stock. Each nav link carries its own section's `data-stock`, so its icon tile shows its stock as a swatch. Text on any stock uses `--stock-ink` (night blue light, pale ink dark).

### Neutral
- **Ground** (`ground`): the document background and the browser theme colour.
- **Surface** (`surface`): cards, the pass, the rail, the bottom bar, sheets, inputs.
- **Section Paper** (derived, `--paper`): the main content field is `color-mix(in oklab, var(--stock) 34%, var(--surface))`, a light print of the section's stock.
- **Surface Sunken** (`surface-sunken`): disabled inputs, the account block in the menu sheet.
- **Rule** (`rule`) and **Surface Border** (`surface-border`): hairlines between rows, card edges, input strokes, empty entry slots, the perforation line.
- **Muted** (`muted`) and **Muted Ink** (`muted-ink`): hover fills, tab rails, secondary text and meta lines. Muted ink passes AA on surface and on every light stock.

### Semantic states
Info, success, warning and danger each pair a pale ground with a deep ink (`info-bg`/`info-fg` and so on); the pale grounds deliberately share the stock family. **Destructive** (`destructive`) is the only solid alarm fill: destructive buttons and the unread-notification count. States are always paired with text or an icon.

### Named Rules
**The Reserved Stamp Rule.** Violet as a mark belongs only to the current user's own bookings: booked, pending (dashed) and the pass slots they have used. Never use it for brand accents, links, charts, or other people's bookings. The focus ring, caret and control accent are the only non-booking uses.

**The One Stock Per Section Rule.** A section owns exactly one stock, assigned in the shell. A page never mixes stocks as decoration; a stock appears outside its section only as a nav swatch.

**The Paper, Not Grey Rule.** The content field is always the section paper derived from the stock, never a neutral grey panel.

## Typography

**Display Font:** Archivo (variable, `wdth` axis), with ui-sans-serif, system-ui fallback
**Body Font:** Archivo at normal width (`wdth` 100)
**Label/Mono Font:** Geist Mono, only for codes (TOTP secrets, chat ids)

**Character:** one grotesque family doing two jobs: normal width for reading, condensed width (`wdth` 74) with tabular lining figures for anything that is counted or timed, like a printed ticket.

### Hierarchy
- **Display** (700, 1.375rem mobile / 2rem desktop, 1.25): the page title in the header band.
- **Figure** (700, 2.5rem, 1, condensed tabular): the remaining-entries count on the pass.
- **Time** (700, 1.375rem mobile / 1.625rem desktop, 1, condensed tabular): lesson start times in the fixed time column; day numbers in the strip at 1.25rem.
- **Headline** (700, 1.25rem, 1.25, balanced): dialog and sheet titles.
- **Title** (600, 17px, 1.375): card titles, pass title, lesson names, day heading, brand name.
- **Body** (400, 15px, 1.5): meta lines, descriptions, toasts; long text capped at 65ch. Form inputs are 16px.
- **Label** (600, 13–14px): form labels, section captions in the nav, avatar sublines.
- **Stamp lettering** (800, 11px, uppercase, 0.08em): only inside a stamp face, always above a 15px condensed date-time detail.

### Named Rules
**The Ticket Figures Rule.** Every time, count, date, duration and version number uses the `.tabular` treatment (condensed width, `tnum` + `lnum`, zero tracking). Running text never does.

**The Mono Is For Codes Rule.** Geist Mono appears only where a machine string must be read character by character.

## Layout

Mobile first, built around a phone held in one hand.

- **Shell.** From `lg` (1024px) up: a sticky 17rem left rail on surface, a content column up to 72rem with 40px side gutters. Below `lg`: a sticky 56px top bar printed on the section stock (gym logo and name; a bell for staff roles), and a fixed bottom tab bar of four role-specific destinations plus Menu (five in total), each 60px tall. Everything else lives in the Menu sheet. Content gutters are 16px, 24px from `sm`, 40px from `lg`; bottom padding clears the tab bar.
- **Header band.** The shell paints a generic stock band (176px, 240px desktop) behind the top of each page. A page that draws its own band marks it `data-page-band`, which hides the shell band; on bookings the band carries title, pass card and day strip and ends exactly on the strip's edge, never across a line of text. Below the band, the field is section paper.
- **Fixed-time rows.** Lesson lists are a three-column grid: a fixed time column (3.5rem, 4.25rem from `sm`), a flexible lesson column (type icon, name, trainer and seats), and a right action column (Prenota, stamp, queue, or a reason). Rows sit directly on the paper, separated by hairline rules, 14px vertical padding, full-bleed on phones.
- **Day strip.** Seven equal 60px day cells between previous/next week arrows; the selected day is filled with ink.
- **Desktop aside.** On bookings, a 20rem column on the right lists upcoming own bookings; on phones it moves below the list.
- **Rhythm.** 4px base; 8, 12, 16, 20 and 24px are the working steps. Every tappable element is at least 44px.

## Elevation & Depth

Flat paper with a hybrid exception: depth comes from stock against paper against surface, and soft night-tinted shadows appear only on the few things that are physically "picked up".

### Shadow Vocabulary
- **Lift** (`--shadow-lift`: `0 1px 2px rgb(31 35 64 / 0.06), 0 6px 18px -8px rgb(31 35 64 / 0.16)`): the pass card, the opened lesson row, the active tab trigger.
- **Sheet** (`--shadow-sheet`: `0 -4px 24px -8px rgb(31 35 64 / 0.18), 0 20px 50px -16px rgb(31 35 64 / 0.3)`): dialogs, bottom sheets, toasts, the Web Push banner.

Dark mode swaps both for black-based equivalents. Overlays dim the page with night blue at 45%.

### Named Rules
**The Picked-Up Rule.** Only the pass, the one opened row, and overlays carry shadow. Lists, nav and ordinary cards stay flat with a hairline.

## Shapes

Soft rectangular ticket forms. Radii step from 8px (badges, stamp faces, icon tiles) to 12px (buttons, inputs, nav links, day cells, rows on desktop) to 16px (cards, the pass, toasts, the banner) to 24px (sheets, top corners only on phones). Avatars, entry slots, tab-bar pills and the notification count are full circles or pills. Strokes are hairlines (1px), outline buttons and entry slots use 1.5px, stamps use 2px.

**The Perforation Rule.** The 2px dashed line is the only ornament: it separates the pass's header from its slots, and as a border it marks anything provisional (pending stamp, queued stamp, waitlist button). Never use dashed borders as decoration.

## Components

### Buttons
Firm, ink-led, quiet at rest.
- **Shape:** 12px corners, 44px tall (36px `sm` only for dense staff tables), 15px semibold.
- **Primary:** night-blue ink fill with white text; hover deepens to `ink-hover`.
- **Outline:** surface fill with a 1.5px ink stroke. This is the row action Prenota. With a dashed stroke it becomes "Metti in coda" (waitlist), same weight.
- **Secondary / Ghost / Destructive:** muted fill; transparent with muted hover; solid destructive red.
- **Feedback:** 150ms colour transition and a 0.98 press scale; disabled at 45% opacity, no press.

### Chips (Badges)
- **Style:** 8px corners, 12px semibold, pale semantic ground with deep ink (neutral, info, success, warning, danger).
- **Stamp variant:** transparent with a violet stroke; reserved for own bookings.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** surface on section paper.
- **Shadow Strategy:** flat with a hairline rule border; the pass card uses Lift instead of a border.
- **Internal Padding:** 20px.

### Inputs / Fields
- **Style:** 44px tall, 12px corners, 1px surface-border stroke on surface, 16px text, muted placeholder; textarea 96px minimum.
- **Focus:** border and 2px outline switch to the violet ring; hover darkens the stroke to muted ink.
- **Error / Disabled:** `aria-invalid` turns the stroke danger ink; disabled sinks to surface-sunken at 70%.

### Navigation
- **Desktop rail:** 44px links, 15px semibold, each with a 28px icon tile showing its section's stock. The active link fills with its stock in stock ink. Settings links sit under a 13px caption; Danger Zone is danger ink. Theme toggle, IT/EN switch, account menu and version at the foot.
- **Mobile:** top bar on the current stock; bottom tab bar with 21px icons over 12px labels, the active tab's icon in a 56x32 stock pill; Menu opens a bottom sheet with the account block and the full nav.

### Dialogs and Sheets
Bottom sheet on phones (full width, 24px top corners, safe-area padding, up to 92dvh), centred 24px-radius panel from `sm`. Title 20px bold, description 15px muted, footer buttons stacked on phones and right-aligned from `sm`. A 44px close button sits top right. Alert dialogs use the same form at a narrower width.

### Season Pass Card (signature)
The member's plan as a season pass at the top of bookings: ticket icon and plan title on the left, the remaining-entries figure (2.5rem condensed) on the right, a dashed perforation, then one round entry slot per entry (up to 20; 10 per row). Used slots carry a violet stroke with a punched violet centre; unused slots are empty rings. Footer: validity date and active bookings, separated by middle dots. Inactive membership turns the whole card to the warning stock with an alert icon. Open plans and trials replace the slots with a sentence.

### Validator Stamp (signature)
A booked row's action column holds a stamp face: 2px violet stroke, 8px corners, 11px uppercase lettering over a 15px condensed date and time. Pending approval is the same stamp dashed; queued is a dashed stamp in muted ink. When cancellable, the stamp is a button (violet wash on hover) that opens the cancel confirmation. On booking, the stamp lands with `stamp-land`: 180ms, scale 1.12 to 0.98 to 1 with opacity in, `cubic-bezier(0.22, 1, 0.36, 1)`, no bounce; instant under reduced motion.

### Lesson Row with In-Place Disclosure (signature)
Tapping a row's time or name opens it in place: the row gains the surface fill and Lift, and a detail list (time range, trainer, cancellation deadline, plan cost, access, seats) appears aligned to the lesson column. Every other row steps back to muted ink. Rows that cannot be acted on (started, access denied) are quiet too and state why in the action column. Nothing reorders.

### Toasts and Banners
Toasts sit top centre: 16px corners, surface, hairline, Sheet shadow, 15px text, semantic icon colour. The Web Push banner floats above the tab bar on phones and bottom right on desktop, with a giallino icon tile and primary plus ghost actions.

## Do's and Don'ts

### Do:
- **Do** let the shell assign the stock: add the route to `STOCK_BY_KEY` and let `--stock` and `--paper` follow.
- **Do** set every time, count and date in `.tabular` (condensed `wdth` 74, tabular lining figures).
- **Do** keep row actions in a fixed right column and change state in place, 120–180ms ease-out.
- **Do** state the reason a row is blocked inside the row (full, access denied, started, cancellation closed).
- **Do** use dashed strokes to mean provisional, and only that.
- **Do** keep 44px targets, 16px input text, and bottom sheets for dialogs on phones.
- **Do** design both themes; check muted ink and stamp on every stock in light and dark.

### Don't:
- **Don't** use stamp violet for anything but the user's own bookings (beyond focus ring, caret and control accent).
- **Don't** put content on a neutral grey ground; the field is the section paper.
- **Don't** add gradient washes, glass, or blur. The only gradient in the build is the hard-stop punched centre of a used entry slot.
- **Don't** add shadow to lists, nav or ordinary cards; lift is for the pass, the opened row and overlays.
- **Don't** use uppercase tracked lettering outside a stamp face and the day strip's weekday abbreviations.
- **Don't** reorder rows or animate layout when state changes.
- **Don't** treat the dashboard, lessons, courses, users, settings or reports layouts as precedent until they are redesigned.
