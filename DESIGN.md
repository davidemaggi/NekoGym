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
  chart-1: "#3b5fc4"
  chart-1-dark: "#6386e3"
  overlay: "rgb(18 20 42 / 0.45)"
  overlay-dark: "rgb(4 5 14 / 0.62)"
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
  xs: "2px"
  sm: "4px"
  md: "6px"
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
  button-ghost-danger:
    textColor: "{colors.danger-fg}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "44px"
  button-ghost-danger-hover:
    backgroundColor: "{colors.danger-bg}"
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
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.input}"
    rounded: "{rounded.xl}"
    padding: "0 40px 0 14px"
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
  stamp-chip:
    textColor: "{colors.stamp}"
    rounded: "{rounded.lg}"
    padding: "4px 8px"
  stamp-face-compact:
    textColor: "{colors.stamp}"
    typography: "{typography.stamp-lettering}"
    rounded: "{rounded.lg}"
    padding: "6px 8px"
    width: "92px"
  badge-neutral:
    typography: "{typography.label}"
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "2px 8px"
  badge-success:
    typography: "{typography.label}"
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success-fg}"
    rounded: "{rounded.lg}"
    padding: "2px 8px"
  badge-warning:
    typography: "{typography.label}"
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-fg}"
    rounded: "{rounded.lg}"
    padding: "2px 8px"
  badge-danger:
    typography: "{typography.label}"
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger-fg}"
    rounded: "{rounded.lg}"
    padding: "2px 8px"
  badge-today:
    typography: "{typography.label}"
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "2px 8px"
  filter-toggle:
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 14px"
    height: "44px"
  filter-toggle-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 14px"
    height: "44px"
  stepper-button:
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    size: "44px"
  timetable-chip:
    backgroundColor: "{colors.stock-giallino}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "4px 0"
  schedule-chip:
    backgroundColor: "{colors.stock-giallino}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 0 0 12px"
    height: "44px"
  lesson-type-tile:
    rounded: "{rounded.xl}"
    size: "48px"
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
    padding: "0 12px"
    height: "44px"
  segmented-control:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.xl}"
    padding: "4px"
  segmented-control-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "44px"
  text-link-action:
    textColor: "{colors.ink}"
    height: "44px"
  todo-tile-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-fg}"
    rounded: "{rounded.xl}"
    size: "44px"
  todo-tile-info:
    backgroundColor: "{colors.info-bg}"
    textColor: "{colors.info-fg}"
    rounded: "{rounded.xl}"
    size: "44px"
  todo-tile-danger:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger-fg}"
    rounded: "{rounded.xl}"
    size: "44px"
  seat-segment-booked:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    height: "7px"
  seat-segment-free:
    backgroundColor: "{colors.surface-border}"
    rounded: "{rounded.xs}"
    height: "7px"
  row-in-progress:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "14px 16px"
  next-lesson-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  next-lesson-card-hover:
    backgroundColor: "{colors.surface-sunken}"
  chart-bar:
    backgroundColor: "{colors.chart-1}"
    rounded: "{rounded.sm}"
  chart-tooltip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.xl}"
    padding: "10px 12px"
  meter-track:
    backgroundColor: "{colors.muted}"
    rounded: "{rounded.full}"
    height: "8px"
  meter-fill:
    backgroundColor: "{colors.chart-1}"
    rounded: "{rounded.full}"
    height: "8px"
  meter-fill-no-show:
    backgroundColor: "{colors.muted-ink}"
    rounded: "{rounded.full}"
    height: "8px"
  status-note-ok:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success-fg}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  status-note-warn:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-fg}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  status-note-neutral:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  person-avatar:
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "44px"
  check-row:
    typography: "{typography.input}"
    height: "44px"
  record-row:
    padding: "12px 0"
    height: "64px"
  notification-row-unread:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "16px"
  auth-ticket:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.3xl}"
    padding: "28px 20px"
    width: "28rem"
  button-auth-submit:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.input}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "48px"
  auth-notice-error:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger-fg}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
---

# Design System: NekoGym

## Overview

**Creative North Star: "Abbonamento"**

NekoGym is an Italian transit season pass. Every section of the app is printed on its own paper stock (mint, azzurro, giallino, rosa, lilla, carta), the ink is a deep night blue, and the only coloured mark that ever belongs to the member is the violet validator stamp on the lessons they have booked. Booking a lesson is validating a ticket: the member reads how many entries are left on their pass, picks a day, scans times set in a fixed column like a departures board, and taps once to watch the stamp land in the row. Staff open the day the same way: the home is the day's timetable in the same fixed-time rows, with a seat strip per lesson and the desk's to-do pile beside it.

The system is flat and paper-like. Type carries hierarchy; chrome is removed. Times, counts and dates are set in Archivo's condensed width with tabular figures, as if printed on a ticket; text runs at normal width. A dashed perforation line is the single ornament, and it carries meaning too: dashed means provisional (pending approval, queued, waitlist). State changes happen in place and rows never reorder. The pastel stocks answer the owner's request for "simple, elegant, pastel" without becoming childish, because they sit under firm night-blue ink and are only ever grounds, never decoration.

The world frames each gym's own name and logo (configurable per installation) and renders admin-chosen lesson-type colours and icons faithfully beside its own palette. Light and dark are both first-class: in dark mode the stocks become deep tinted inks on a night ground and the stamp lightens to a pale violet.

Status of the build: the signed-in app is the world: Bookings, the per-role Home (staff and member), Lessons, Courses, Users, the notifications inbox, the settings pages (profile, site, registries, notifications, danger zone), Reports and the sign-in pages (login, register, forgot and reset password, verify email), together with the shared lesson dialog, the lesson manage dialog, the single lesson form and its repeat controls, the quick-profile popover, the status screens (404, error), the shared page band, the settings building blocks, the app shell (rail, mobile top bar, bottom tab bar, menu sheet), the shared primitives in `components/ui` (including the native select), the home charts, the toaster, the Web Push banner and the PWA install banner.

**Key Characteristics:**
- One paper stock per section; the current stock tints the shell and the page header band.
- Night-blue ink for text and primary actions; never a neutral admin grey ground.
- One reserved violet stamp for the user's own bookings.
- Condensed tabular figures for every time, count and date.
- Dashed perforation as the only ornament, also meaning "provisional".
- Flat paper; lift only on things picked up: the pass card, the sign-in ticket, the opened or in-progress row, the member's next lesson, an unread notification, the active tab or segment, and overlays.
- Seats are counted, not charted: one ink segment per seat, dashed while held by a pending request.
- 44px touch targets, 16px input text, bottom sheets on phones.

## Colors

A cool paper-and-ink palette: pale transit-pass stocks as grounds, night-blue ink, one saturated violet held in reserve.

### Primary
- **Night-Blue Ink** (`ink`): body text, headings, primary buttons, the selected day chip, outline-button strokes (1.5px). In dark mode it inverts to Pale Ink (`ink-dark`) on the night ground, and primary buttons become pale with night text.

### Secondary
- **Validator Violet** (`stamp`; dark `stamp-dark`): the stamp. Fills the used entry slots on the pass, draws the stamp face on booked rows, the own-booking dot under a day in the day strip, and the booked chips in the upcoming list. On the member home it also stamps the next-lesson card and the booked chips in the later list. Its tint **Stamp Wash** (`stamp-soft`) is the hover behind a stamp button and the text-selection colour. The same violet is also the focus ring, text caret and native control accent: interaction affordances, not content marks.

### Tertiary: Ticket Stocks
- **Mint** (`stock-mint`): Prenotazioni (bookings); also the trainee avatar.
- **Azzurro** (`stock-azzurro`): Lezioni; also the trainer avatar.
- **Giallino** (`stock-giallino`): Corsi, Notifiche, Registri; also the Web Push banner's icon tile.
- **Rosa** (`stock-rosa`): Utenti, Danger Zone.
- **Lilla** (`stock-lilla`): Report, manual notifications, the sign-in pages; also the user-initials avatar in the shell and the admin avatar in the users list.
- **Carta** (`stock-carta`): Home (dashboard), profile, site settings, and the fallback.

The shell resolves the current section to one stock (`STOCK_BY_KEY` in the app shell) and sets `data-stock` on the layout root; `--stock` then resolves to that stock. Each nav link carries its own section's `data-stock`, so its icon tile shows its stock as a swatch. Text on any stock uses `--stock-ink` (night blue light, pale ink dark).

### Neutral
- **Ground** (`ground`): the document background and the browser theme colour.
- **Surface** (`surface`): cards, the pass, the rail, the bottom bar, sheets, inputs.
- **Section Paper** (derived, `--paper`): the main content field is `color-mix(in oklab, var(--stock) 34%, var(--surface))`, a light print of the section's stock.
- **Surface Sunken** (`surface-sunken`): disabled inputs, the account block in the menu sheet.
- **Rule** (`rule`) and **Surface Border** (`surface-border`): hairlines between rows, card edges, input strokes, empty entry slots, the perforation line.
- **Muted** (`muted`) and **Muted Ink** (`muted-ink`): hover fills, tab and segmented-control rails, the chart hover cursor, secondary text, meta lines and chart axis labels. Muted ink passes AA on surface and on every light stock.
- **Overlay** (`overlay`; dark `overlay-dark`): the night-blue scrim behind every dialog, alert dialog and sheet, always through the `--overlay` token.

### Semantic states
Info, success, warning and danger each pair a pale ground with a deep ink (`info-bg`/`info-fg` and so on); the pale grounds deliberately share the stock family. **Destructive** (`destructive`) is the only solid alarm fill: destructive buttons and the unread-notification count. States are always paired with text or an icon.

### Data
- **Chart Blue** (`chart-1`; dark `chart-1-dark`): the single-series bar colour (the staff crowding chart) and the fill-rate meter in the reports' course health. Validated for an OKLCH lightness band, a chroma floor and at least 3:1 against surface in both themes. It is a data ink only, never a UI accent.
- **Lesson-type colours** (admin-chosen, per installation): the categorical palette. A multi-series chart colours each series by its lesson type's own colour, exactly as the type icon is coloured in rows.
- **Second measure on one scale**: when two percentages share a row (fill rate and no-show in course health), the second is drawn in muted ink, not a second hue.
- **Grid and axes**: grid lines in surface border, horizontal only; no axis lines or ticks; axis labels 13px muted ink.

### Named Rules
**The Reserved Stamp Rule.** Violet as a mark belongs only to the current user's own bookings: booked, pending (dashed) and the pass slots they have used. Never use it for brand accents, links, charts, or other people's bookings. The focus ring, caret and control accent are the only non-booking uses.

**The One Stock Per Section Rule.** A section owns exactly one stock, assigned in the shell. A page never mixes stocks as decoration; a stock appears outside its section only as a nav swatch or as a role tint on a person's initials avatar (admin lilla, trainer azzurro, trainee mint), which always sits beside the role named in a tag.

**The Paper, Not Grey Rule.** The content field is always the section paper derived from the stock, never a neutral grey panel.

**The Type Owns Its Colour Rule.** In charts a category's colour is its lesson type's admin colour, keyed to the type and never to its rank or position; a single series uses Chart Blue. Identity is never colour alone: any chart with two or more series carries a legend.

## Typography

**Display Font:** Archivo (variable, `wdth` axis), with ui-sans-serif, system-ui fallback
**Body Font:** Archivo at normal width (`wdth` 100)
**Label/Mono Font:** Geist Mono, only for codes (backup file names, the TOTP secret, the Telegram link code, command and chat id)

**Character:** one grotesque family doing two jobs: normal width for reading, condensed width (`wdth` 74) with tabular lining figures for anything that is counted or timed, like a printed ticket.

### Hierarchy
- **Display** (700, 1.375rem mobile / 2rem desktop, 1.25): the page title in the header band.
- **Figure** (700, 2.5rem, 1, condensed tabular): the remaining-entries count on the pass. The report KPIs use the same figure at 1.75rem on phones and 2.5rem from `sm`. Smaller ticket figures: the to-do count tile (20px) and the booked-seats count over a seat strip (17px).
- **Time** (700, 1.375rem mobile / 1.625rem desktop, 1, condensed tabular): lesson start times in the fixed time column; day numbers in the strip at 1.25rem; 2rem on the member's next-lesson card.
- **Headline** (700, 1.25rem, 1.25, balanced): dialog and sheet titles.
- **Title** (600, 17px, 1.375): card titles, pass title, lesson, course, person and lesson-type names, notification subjects, settings section and report headings, day headings (bookings strip, lessons month list), the month label in a month stepper, empty-state titles, brand name, and section headings on the home (Oggi, Da fare, chart titles). To-do item titles, people-list headings in the lesson dialog and the schedule heading in the course form step down to 15px semibold.
- **Body** (400, 15px, 1.5): meta lines, descriptions, toasts; long text capped at 65ch. Form inputs are 16px.
- **Label** (600, 13–14px): form labels, section captions in the nav, avatar sublines, and every status tag (13px).
- **Weekday caps** (600, 12px, uppercase, no added tracking, muted ink): the three-letter weekday heads of the course timetable, the only uppercase outside the stamp and the day strip.
- **Stamp lettering** (800, 11px, uppercase, 0.08em): inside a stamp face, always above a 15px condensed date or date-time detail. The stamp chip in lists uses the same face at 12px with 0.06em tracking and no detail line.

### Named Rules
**The Ticket Figures Rule.** Every time, count, date, duration and version number uses the `.tabular` treatment (condensed width, `tnum` + `lnum`, zero tracking), including chart tooltip values. Running text never does: when a figure sits inside a sentence, only the figure is set tabular (fill the sentence template with nodes, not strings).

**The Mono Is For Codes Rule.** Geist Mono appears only where a machine string must be read character by character: backup file names, the TOTP secret, the Telegram link code, command and chat id. Dates, sizes, counts and percentages beside a code are never mono; they are `.tabular`.

## Layout

Mobile first, built around a phone held in one hand.

- **Shell.** From `lg` (1024px) up: a sticky 17rem left rail on surface, a content column up to 72rem with 40px side gutters. Below `lg`: a sticky 56px top bar printed on the section stock (gym logo and name; a bell for staff roles), and a fixed bottom tab bar of four role-specific destinations plus Menu (five in total), each 60px tall. Everything else lives in the Menu sheet. Content gutters are 16px, 24px from `sm`, 40px from `lg`; bottom padding clears the tab bar.
- **Header band.** The shell paints a generic stock band (176px, 240px desktop) behind the top of each page. A page that draws its own band marks it `data-page-band`, which hides the shell band; on bookings the band carries title, pass card and day strip and ends exactly on the strip's edge, never across a line of text. Below the band, the field is section paper.
- **Page band (shared).** The `PageBand` component is the page-owned band for every list and settings page: the stock runs full-bleed and ends on its own edge (20px bottom padding, 24px from `lg`), the title at display size with an optional description in stock ink at 75%, an optional primary action top right, and optional children below the header for filters, tabs or period links (20px above them). A new page draws its band with `PageBand` rather than hand-rolling one.
- **Fixed-time rows.** Lesson lists are a three-column grid: a fixed time column (3.5rem, 4.25rem from `sm`), a flexible lesson column (type icon, name, trainer and seats), and a right action column (Prenota, stamp, queue, or a reason). Rows sit directly on the paper, separated by hairline rules, 14px vertical padding, full-bleed on phones.
- **Day strip.** Seven equal 60px day cells between previous/next week arrows; the selected day is filled with ink. Days without lessons are greyed (muted ink, medium-weight number); for members they are disabled at 55% opacity, staff can still open them to add a lesson.
- **Bookings views.** A three-option segmented control (Giorno / Settimana / Mese) sits top right of the bookings band, saved per user. Week: a centred period stepper ("2–8 nov") in the band, then the week as day sections (17px heading, a muted "Oggi" pill) with empty days collapsed to one 44px greyed line ("Domenica 8 novembre · Chiuso"). Month: a month stepper, weekday caps, and a 7-column grid of 48px day cells (56px from `sm`) with up to three 6px dots for the day's lessons, the user's own bookings first as solid stamp violet, the others pale (muted ink at 35%; on the selected ink cell, solid vs 40% paper); closed days are struck through, days of neighbouring months sit at 45% opacity; the tapped day's lessons list below the band.
- **Medical certificate.** A chip in the users list (13px semibold, 8px corners, heart-pulse icon, words always present): success fill above 30 days ("Certificato fino al …"), warning at 30 or less, danger at 7 or less ("scade tra N giorni"), inverted ink (foreground fill, background text) once expired, muted "Nessun certificato" for members without one. On the member home an expiring or expired certificate opens the band with a 16px-cornered notice in the same tones (22px icon, 17px title, 15px body), above the pass. Pending requests caused by the certificate carry a 14px semibold warning line with the reason.
- **Inline approvals.** On staff rows, open requests show as "· N da confermare" in warning ink on the meta line; the expanded row lists each pending person (name, plan usage tag) with Conferma (primary) and Non confermare (outline), 44px each.
- **Home.** One home per role, on the carta stock. The page draws its own band (greeting at display size, then the long date in stock ink at 75%; staff add "N lessons · M booked"; members get the pass card inside the band). Staff: two columns from `lg`, today's rows on the left and a 22rem to-do column on the right, 40px apart; on phones they stack with the to-do list first whenever it has items. Today's rows add a fourth column from `sm` (time 4.25rem, lesson, 8.5rem seat strip, action); on phones the seat count moves under the time as a 13px figure. Charts sit below a full-width rule, side by side from `xl`. Members: a single 48rem column with the next lesson, the later list, then the Prenota call to action and the chart below a rule.
- **Lessons.** Staff only (members are sent to Bookings), on the azzurro stock. The page draws its own band: title and a "N lessons · M booked this month" line in stock ink at 75% with tabular figures, the "Crea lezione" primary top right (a 44px icon-only square below `sm`, named by `aria-label`), then a month stepper and the filter toggles on one wrapping row. Below the band the month is a list of day sections, 24px apart, each opened by a 17px day heading with the day's lesson count right-aligned in 15px muted, and holding fixed-time rows with the same four columns as the staff home (time 4.25rem, lesson, 8.5rem seat strip, action; the seat count moves under the time below `sm`).
- **Course catalog (members).** On the giallino stock. Cards on the paper, 1/2/3 columns (`sm`/`xl`), 16px gaps: surface, 16px corners, 20px padding, lift shadow, the whole card one link (hover sinks to surface sunken). A 56px lesson-type icon tile (icon colour at 18% fill, 45% stroke, 12px corners) beside the 17px name and a muted "type · trainer" line; a three-line plain-text excerpt of the description; then, pinned to the bottom, the tabular schedule summary ("Lun 07:30 · Mer 07:30") in 14px muted and a "Scopri il corso" text link with chevron.
- **Course page.** Band: a back link ("Tutti i corsi"), the 64px icon tile (16px corners), the name as page title, "type · trainer" and "55 min · Fino a 9 persone" in stock ink at 75%. Below: the Markdown description on the left; a 20rem aside on `lg` (stacked under a rule on phones) with "Quando si tiene" (weekday rows, start–end times right-aligned, tabular) and "Prossime lezioni" (44px rows: date · time and seats, a chevron; each opens that day in bookings).
- **Markdown text.** Descriptions render in 15px at relaxed leading, 65ch max: Markdown headings step down to 19/17/15px semibold titles, lists keep their bullets, quotes get a 2px rule and muted ink, links are semibold and underlined. Images and raw HTML never render.
- **Markdown editor.** A 12px-cornered input box with a toolbar row above a hairline: 44px icon buttons (bold, italic, heading, subheading, bulleted and numbered list, quote; undo/redo from `sm`), `aria-pressed` with a muted fill when active. The writing area is 16px with the same heading/list styles as the rendered text.
- **Course lessons.** In the lesson dialog the subtitle carries a "Corso" chip (book icon, muted fill, pill) after the lesson type, the details list gains a "Corso" row (book icon and name), and the course description follows under a rule with a "Scheda del corso" link. Bookings rows show the same "Corso" line (linked) and description when expanded.
- **Courses.** On the giallino stock. The band carries title and subtitle, then (admin only, from `sm`) the "Mostra cancellati" toggle and the "Nuovo corso" primary, then a search field (leading 18px icon, up to 24rem) beside the trainer segmented control. Course rows sit on the paper, 20px vertical padding, hairline-separated, full-bleed on phones; from `lg` they are three columns: identity (`1fr`), the week timetable (`1.15fr`), and the action. Below `lg` the three stack.
- **Users.** On the rosa stock. The band carries title and description, the "Nuovo utente" primary (icon-only 44px below `sm`), then a search field (up to 24rem from `lg`) beside the role segmented control and a status select. Person rows sit on the paper, 16px vertical padding, hairline-separated, full-bleed on phones: a 44px avatar column, name and email, then the tags; from `lg` the tags take their own column (`1.2fr` identity, `1fr` tags), below `lg` they wrap under the name. The action column holds an outline Modifica (from `sm`) and a 44px overflow menu.
- **Notifications inbox.** On the giallino stock. The band's description counts the unread ("N non lette") with a tabular figure; the band action is a ghost-danger "Elimina tutte" (icon-only below `sm`). Messages are rows in a 48rem column, full-bleed on phones, with pagination below.
- **Settings.** Every settings page draws a `PageBand` (with segmented tabs inside when the page has several panels: profile, site, danger zone) and then a single `max-w-2xl` column of settings sections; registries (48rem) and the notification outbox (64rem) use wider columns because they hold record lists. Profile and site stock is carta, registries and notifications giallino, danger zone rosa.
- **Reports.** On the lilla stock. The band holds title, description and the PDF export action (an outline link, icon-only 44px below `sm`), then the period links. Below the band a 64rem column: three KPIs in a row at every width, then ruled report sections stacked one under another, each opened by a 17px heading.
- **Sign-in.** Outside the shell, on the lilla stock: a stock band (256px, 320px from `sm`) at the top of the section paper and one centred ticket (28rem max) whose top half sits on the band. Inside, in order: the gym name as a 1.75rem bold heading, the Accedi / Iscriviti segmented links, the method switch (Password / Codice / Link) with a one-line 15px muted hint, labelled fields, the 48px submit, then secondary links as underlined text-link actions.
- **Desktop aside.** On bookings, a 20rem column on the right lists upcoming own bookings; on phones it moves below the list.
- **Rhythm.** 4px base; 8, 12, 16, 20 and 24px are the working steps. Every tappable element is at least 44px.

## Elevation & Depth

Flat paper with a hybrid exception: depth comes from stock against paper against surface, and soft night-tinted shadows appear only on the few things that are physically "picked up".

### Shadow Vocabulary
- **Lift** (`--shadow-lift`: `0 1px 2px rgb(31 35 64 / 0.06), 0 6px 18px -8px rgb(31 35 64 / 0.16)`): the pass card, the sign-in ticket, the opened lesson row, the in-progress row on the staff home, the member's next-lesson card, an unread notification, the status ticket (404, error), the active tab trigger, the active segment (including the chosen attendance option) and the current period link.
- **Sheet** (`--shadow-sheet`: `0 -4px 24px -8px rgb(31 35 64 / 0.18), 0 20px 50px -16px rgb(31 35 64 / 0.3)`): dialogs, bottom sheets, popovers (the quick profile), toasts, chart tooltips, the Web Push banner.

Dark mode swaps both for black-based equivalents. Overlays dim the page with the `overlay` token (night blue at 45%; near-black at 62% in dark mode).

### Named Rules
**The Picked-Up Rule.** Only the pass, the sign-in ticket, the status ticket, the one opened or in-progress row, the member's next lesson, an unread notification, the active tab or segment, and overlays carry shadow. Lists, nav, inline banners, settings sections and ordinary cards stay flat with a hairline.

## Shapes

Soft rectangular ticket forms. Radii step from 8px (badges and status tags, stamp faces, icon tiles, segment options) to 12px (buttons, inputs and selects, filter toggles, stepper buttons, schedule chips, the dialog's lesson-type tile, nav links, day cells, rows on desktop) to 16px (cards, the pass, toasts, the banner) to 24px (sheets, top corners only on phones). Avatars, entry slots, tab-bar pills, the notification count, the unread dot, status notes and report meters are full circles or pills. Data marks are nearly square: seat segments at 2px, chart bar tops at 4px, legend and tooltip swatches at 3px, course timetable chips at 6px. Strokes are hairlines (1px), outline buttons, filter toggles, entry slots and the scheduled-bar outline use 1.5px, stamps and stamp chips use 2px.

**The Perforation Rule.** The 2px dashed line is the only ornament: it separates the pass's header from its slots, and as a border it marks anything provisional (pending stamp, pending stamp chip, queued stamp, waitlist button, a seat held by a pending request). Never use dashed borders as decoration.

**The Hatch Rule.** In charts, a lesson that is scheduled but not yet held is a 45° hatch in its type colour over surface, outlined 1.5px in the same colour; held lessons are solid. The legend always explains the hatch. The hatch is the chart's counterpart of the perforation and appears nowhere else.

## Components

### Buttons
Firm, ink-led, quiet at rest.
- **Shape:** 12px corners, 44px tall (36px `sm` only for dense staff tables), 15px semibold.
- **Primary:** night-blue ink fill with white text; hover deepens to `ink-hover`.
- **Outline:** surface fill with a 1.5px ink stroke. This is the row action Prenota. With a dashed stroke it becomes "Metti in coda" (waitlist), same weight.
- **Secondary / Ghost / Destructive:** muted fill; transparent with muted hover; solid destructive red.
- **Ghost danger:** transparent with danger ink and a leading 18px icon (CalendarX2 for a lesson, Trash2 for a course, a user, a lesson type, a backup or the whole inbox), danger-ground hover. It is the only way into a destructive action, from a dialog footer, a settings section (Disabilita 2FA) or a page band (Elimina tutte), and always opens an alert dialog whose confirm is the solid destructive button.
- **Named confirms:** an alert dialog's confirm says the act in its own verb (Elimina, Disattiva, Attiva, Annulla lezione), never a generic "Conferma". Only deactivation and deletion take the solid destructive fill; reactivating is a primary.
- **Icon-only below `sm`:** a page's band action ("Crea lezione", "Nuovo corso", "Nuovo utente", "Crea tipo", "Esporta PDF") collapses to a 44px square with its plus icon and keeps its name in `aria-label`; from `sm` the label returns.
- **Text-link action (tertiary):** 15px semibold ink text with a 1.5px underline at 4px offset that thickens to 2px on hover, a trailing 16px chevron when it navigates or opens a sheet, and a 44px minimum height. It is the one action language of the to-do list (Apri conferme, Segna presenze, Apri il giorno) and the tertiary action in sheets.
- **Lesson manage trigger:** the staff row action (Gestisci, or Presenze once a lesson has ended with attendance to mark) is an outline button; the same trigger renders as a text-link action inside a to-do item. Restore actions (Ripristina on a cancelled lesson or deleted course) are outline buttons with a 16px RotateCcw icon; "Modifica" on a course row is an outline button with a 16px pencil.
- **Feedback:** 150ms colour transition and a 0.98 press scale; disabled at 45% opacity, no press.

### Chips (Badges)
- **Style:** 8px corners, 13px semibold, 2px 8px padding, pale semantic ground with deep ink (neutral, info, success, warning, danger). Badges have no stamp variant. The `Badge` primitive renders exactly this.
- **Status tags in rows:** under the meta line of a lesson or course row, 6px gap. Annullata (cancelled lesson) and Cancellato (deleted course) on the danger ground; Modificata on the warning ground, followed by its reasons after a colon ("Modificata: orario, trainer") when the lesson no longer matches its course. Kind-of-lesson facts (Singola, for a lesson outside any course) are not tags: they are a segment of the muted meta line.
- **Oggi tag:** beside today's day heading, the neutral tag on surface instead of muted, so it reads on the section paper.
- **Person tags:** in a person row, the role on the neutral ground, Disattivato on warning, and for trainees the membership (Attiva on success, Inattiva on warning) followed by the plan name and its plan usage tag.
- **Plan usage tag:** what a trainee has spent of their plan, never what is left. The badge form (8px corners, 13px semibold, 2px 8px) on the neutral ground, the figure tabular: "3/12 usate · mese", the period one of sett., mese, pacchetto. At the limit it turns to the warning ground and adds "· esaurito", so the state is said in words; screen readers hear the whole sentence ("3 lezioni su 12 nel mese"). When the plan name is printed beside it the period is dropped (`hidePeriod`: the users list writes "Pacchetto 4/10 usate"; weekly and monthly keep theirs). It sits right of the name in the lesson dialogs' people lists, counted in the lesson's own week or month so approvals and queue promotions read at a glance, and after the plan name in the users list, counted in the current period.
- **Status note:** a settings section's current state (email verified, 2FA on, a site value configured): a pill (full radius, 4px 10px) with a 15px icon and 14px semibold words on the success, warning or muted ground. Never colour alone, never a bare dot.
- **Stamp chip:** own bookings in compact lists (the upcoming aside on bookings, the later list on the member home) wear the stamp face itself, reduced: transparent, 2px violet stroke, 8px corners, 12px extra-bold uppercase lettering at 0.06em, no detail line; dashed when pending.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** surface on section paper.
- **Shadow Strategy:** flat with a hairline rule border; the pass card uses Lift instead of a border.
- **Internal Padding:** 20px.

### Inputs / Fields
- **Style:** 44px tall, 12px corners, 1px surface-border stroke on surface, 16px text, muted placeholder; textarea 96px minimum.
- **Focus:** border and 2px outline switch to the violet ring; hover darkens the stroke to muted ink.
- **Error / Disabled:** `aria-invalid` turns the stroke danger ink; disabled sinks to surface-sunken at 70%.
- **Search:** the same field with an 18px muted search icon inset 14px on the left and 40px left padding.
- **Labels:** the `Label` primitive is a block, 14px semibold ink, 4-6px above its field; hints sit below the field in 14px muted ink.
- **Check row:** a checkbox is never a bare box: its label is the whole 44px row (16px text, optional 14px muted hint), with the native checkbox at 20px in the violet control accent. Disabled rows drop to 55% opacity. In a multi-select list (the notification outbox) the bare checkbox keeps a 44px hit area around the 20px box.
- **OTP code:** six separate boxes, never one long field: 44px wide and 48px tall, 6px apart, 12px corners, hairline surface-border stroke on surface, the digit as a 22px semibold ticket numeral (`.tabular`). The active box takes an ink stroke with a 2px ink ring at 20%. Used by sign-in, 2FA and the danger-zone reset.
- **Native select:** every `<select>` carries the `.ui-select` component class: the input's 44px height, 12px corners, hairline stroke, surface fill and 16px text, native appearance removed and a drawn 16px chevron in muted ink 14px from the right (40px right padding); the chevron redraws in pale muted ink in dark mode. Hover, focus and disabled match the text input. Never ship an unstyled native select.

### Navigation
- **Desktop rail:** 44px links, 15px semibold, each with a 28px icon tile showing its section's stock. The active link fills with its stock in stock ink. Settings links sit under a 13px caption; Danger Zone is danger ink. Theme toggle, IT/EN switch, account menu and version at the foot.
- **Mobile:** top bar on the current stock; bottom tab bar with 21px icons over 12px labels, the active tab's icon in a 56x32 stock pill; Menu opens a bottom sheet with the account block and the full nav.

### Dialogs and Sheets
Bottom sheet on phones (full width, 24px top corners, safe-area padding, up to 92dvh), centred 24px-radius panel from `sm`, over the `overlay` scrim. Title 20px bold, description 15px muted, footer buttons stacked on phones and right-aligned from `sm`. A 44px close button sits top right. Alert dialogs use the same form at a narrower width. Footer order is fixed: an optional destructive slot (ghost danger), then ghost Chiudi, then the primary. From `sm` the destructive slot is pushed to the far left, away from the primary; on phones the stack reverses, so the primary is on top and the destructive action is last, furthest from the thumb. Lists inside a sheet (the approval sheet) are hairline-separated rows: 17px name, 15px muted meta with tabular date, then a 44px action group in descending weight: primary (Conferma), outline (Non confermare), and a flush text-link action for the rare third choice.

### Segmented Control
A small set of mutually exclusive views or filters on a muted rail: 12px corners, 4px inset, 44px options in 15px semibold muted ink at 8px corners; the pressed option sits on surface with Lift in ink. Options are `aria-pressed` buttons in a labelled group. Used for the chart range (week / month / year), the course trainer filter (Tutti / Con trainer / Senza trainer), the users role filter, the course form's two panels (Dettagli / Schedulazione), the user edit dialog's four panels (Profilo / Iscrizione / Piano / Accessi, wrapping onto a second line when narrow), the lesson manage dialog's two panels (Dettagli / Persone), the repeat modes and the repeat end (Per N volte / Fino al) and the settings pages' panels. The shared `SegmentedTabs` switches panels in place; with more than three options it becomes an even 2x2 grid on phones instead of a ragged wrap, and an inline rail from `sm`. When the choice changes the URL (the report period), the options are links in a labelled `nav` with `aria-current="page"` on the current one, drawn identically. On a stock band the rail is surface at 70% instead of muted, and inactive options are stock ink at 75%. The Radix tabs primitive is the same object (muted rail, 44px triggers at 14px, active on surface with Lift).

### Filter Toggle
An independent on/off filter that lives in a page band (Lessons: Solo le mie for trainers, Mostra passate, Mostra annullate; Courses: Mostra cancellati). 44px, 12px corners, 15px semibold, 14px side padding, 1.5px stroke. Off: transparent on the stock with the stock edge stroke (`--stock-edge`) and stock ink at 80%, surface-at-60% hover. On: surface fill, 1.5px ink stroke, ink text and a leading 16px check, so the state never relies on fill alone. Toggles are links that keep state in the URL, exposed as `role="button"` with `aria-pressed`. Several toggles may be on at once; use the segmented control when the choices exclude each other.

### Month Stepper
Previous and next 44px icon links (20px chevrons, 12px corners, surface-at-70% hover) around the month and year in 17px semibold, capitalised, in a fixed 9.5rem slot so the arrows do not move as the month name changes. It sits in the band, in a labelled `nav`. The home chart's day stepper is the same object at 15px.

### Season Pass Card (signature)
The member's plan as a season pass at the top of bookings: ticket icon and plan title on the left, the remaining-entries figure (2.5rem condensed) on the right, a dashed perforation, then one round entry slot per entry (up to 20; 10 per row). Used slots carry a violet stroke with a punched violet centre; unused slots are empty rings. Footer: validity date and active bookings, separated by middle dots. Inactive membership turns the whole card to the warning stock with an alert icon. Open plans and trials replace the slots with a sentence. Weekly and monthly passes follow the period being looked at: the caption reads "liberi questa settimana" for the current one and "liberi 2–8 nov" / "liberi a dicembre" otherwise.

### Validator Stamp (signature)
A booked row's action column holds a stamp face: 2px violet stroke, 8px corners, 11px uppercase lettering over a 15px condensed date and time. Pending approval is the same stamp dashed; queued is a dashed stamp in muted ink. When cancellable, the stamp is a button (violet wash on hover) that opens the cancel confirmation. On booking, the stamp lands with `stamp-land`: 180ms, scale 1.12 to 0.98 to 1 with opacity in, `cubic-bezier(0.22, 1, 0.36, 1)`, no bounce; instant under reduced motion.

### Seat Strip (signature)
Occupancy on staff rows: the booked count as a 17px bold ticket figure over "/max" in 14px muted, then a 7px strip with one segment per seat (2px corners, 2px gaps) up to 16 seats. Confirmed seats are solid ink, seats held by pending requests are dashed ink outlines, free seats are surface border. Beyond 16 seats the strip becomes one continuous rounded bar with the same three states. Seats are ink, never stamp violet: they are other people's bookings. On a cancelled lesson the whole strip, figure included, steps back to 50% opacity (the `muted` variant); its counts stay legible as a record.

### Staff Today Row
The fixed-time row on the home: time and duration (muted once the lesson has ended), type icon and name, a meta line (trainer, "in corso" in semibold success ink, queue and pending counts), the seat strip, and the manage trigger. The lesson in progress is lifted out of the list: surface fill, Lift, 16px corners from `sm`, full-bleed on phones.

### Lessons Month Row
The staff today row extended to a month. Time column: start time, duration (13px muted tabular), and below `sm` the seat count as a 13px semibold figure with "+N" pending. Lesson column: type icon and 17px name, a muted meta line (trainer, Singola for a lesson outside any course, queue length), then any status tags. Action column: the manage trigger for staff who can manage the lesson, Ripristina on a cancelled one, nothing otherwise. States, all in place: ended rows mute the time column; cancelled rows strike the name through (1px), mute it and the time, mute the seat strip, and wear the Annullata tag; the lesson in progress is lifted as on the home. There is no destructive action in the row.

**The Deliberate Delete Rule.** Cancelling a lesson and deleting a course, a person, a lesson type or a backup are never row actions. They live in the footer of the object's own dialog as a ghost-danger button and always pass through a confirmation with the solid destructive button, named by its act. Rows carry only the forward action (manage, edit, open) or the undo (restore). One exception, scoped to a lesson's own manage dialog: taking a person off the lesson or out of the queue sits behind a 44px overflow menu at the end of that person's row (one item in danger ink), and still passes through an alert dialog whose solid destructive confirm names the act (Rimuovi dalla lezione, Rimuovi dalla coda). Page lists never carry it.

### Lesson Dialog (shared)
The staff view of one lesson, opened from "Gestisci lezione" on Lessons, Bookings and Home. On Lessons and Bookings a second outline action sits beside it, "Gestisci persone" (16px people icon, the label, the people count in muted tabular figures at a fixed 2ch, a 12px warning dot at the top-right corner when requests wait), which opens the lesson manage dialog straight on its people; in Lessons rows it shrinks below `sm` to icon and count (and "Gestisci lezione" to "Gestisci"), its full name kept for screen readers. On Home the attendance actions ("Presenze", the to-do link) open the people manager directly. Header: a 48px lesson-type tile (12px corners, the type's own colour at 18% as fill with a 1px stroke at 50%, 28px icon in the type colour), the lesson name as the title, and "type · Corso" as the description (or the generic description when the lesson has no type). Two tabs, Informazioni and Persone, the second carrying its total count in muted tabular figures. Informazioni is a definition list in 15px: muted terms in a 7rem column, the date and time range in semibold tabular ("sab 31 ott · 08:00–08:55"), trainer, booked count with queue; then the description in muted text capped at 60ch; then, below a hairline rule, the broadcast block (15px semibold heading, textarea, outline Send button). Persone is three 15px people lists (iscritti, in attesa di conferma, in coda), each with a 15px semibold heading and its count right-aligned in muted tabular, people as 44px hairline-separated rows (the name as a quick-profile trigger, the plan usage tag on the right), an empty sentence when none. Footer: destructive slot (Annulla lezione, only for upcoming lessons), ghost Chiudi, ghost "Ripeti…" with a 16px Repeat icon (only for a lesson outside any course, opening the repeat dialog), primary "Modifica lezione" with a pencil (only when the lesson's own fields can be edited: course lessons take them from the course), in the order set under Dialogs and Sheets; on phones the stack reads Modifica lezione, Ripeti…, Chiudi, Annulla lezione. The Persone tab ends with an outline "Gestisci persone" button.

### Lesson Manage Dialog
The staff's working view of one lesson. It opens on a single view, without tabs: "Modifica lezione" (the lesson's fields) or "Gestisci persone" (people, trainer, broadcast), each titled by its action. Used without a view it falls back to a `SegmentedTabs` pair (Dettagli / Persone). Dettagli is the single lesson form's fields with a primary save. Persone is a column of sections separated by a hairline rule and 20px of space, each headed in 17px semibold with its count right-aligned in muted tabular:
- **Trainer:** a native select beside an outline "Aggiorna trainer" (stacked on phones), disabled until the pick differs. The save is explicit because a change notifies people; a stray pick must not send it.
- **Iscritti:** hairline-separated rows, the name in 16px semibold as a quick-profile trigger with the plan usage tag beside it. While attendance can be marked, a two-option segmented control (Presente / Assente) sits under the name: muted rail, 44px options in 15px semibold, `aria-pressed`; the chosen option carries a 16px check on the success (Presente) or warning (Assente) ground with Lift. Once it can no longer change, a status note states it. Below the list, a select and an outline add button put a person on the lesson.
- **In attesa di conferma:** written actions in descending weight: primary Conferma, outline Non confermare, and, where open access can be granted, the underlined text action "Conferma + accesso libero" (1.5px underline at 4px offset, full width on phones).
- **In coda:** an ordered list; each position is a muted 15px semibold tabular figure in a 32px column (spoken "1° in coda"), then the name and an outline confirm.
- **Avvisa iscritti:** the broadcast block, last.
Removing a person from the lesson or the queue goes through the row's 44px overflow menu and a named destructive confirm, the one exception the Deliberate Delete Rule allows.

### Single Lesson Form
A lesson outside any course is created and edited in a dialog titled "Lezione singola" ("Una lezione fuori dai corsi: puoi crearla una volta o ripeterla."). The word "standalone" is a code name and never reaches the copy. Title, description, start, then duration, seats and cancellation limit two or three to a row in tabular fields, then the lesson type, then the repeat controls.

### Repeat Controls
How a lesson outside any course repeats: inside the single lesson form, and in "Ripeti lezione", the dialog behind the details footer's "Ripeti…". Below a hairline, a segmented control of four modes: Non ripetere, Ogni giorno, Ogni settimana, Date scelte.
- **Weekday chips (Ogni settimana):** seven 44px `aria-pressed` chips, 8px corners, 15px semibold, Monday first. Picked is ink fill with white text; unpicked is the muted ground; a weekday the gym is closed is struck through (1px) in muted ink.
- **End (daily and weekly):** a second segmented control, Per N volte / Fino al, over a tabular count or date field.
- **Calendar (Date scelte):** 44px icon steppers around the 15px semibold month, 12px weekday-caps heads, then 44px tabular day cells at 8px corners. Picked days are ink fill; closed days are struck through and named "chiuso"; days before the start are disabled at 50%; the lesson's own day is a fixed solid ink fill with a 4px dot under the figure, pressed and not toggleable. No cell is dashed: dashed stays provisional-only.
- **Preview:** a `role="status"` box on the muted ground (12px corners, 16px 12px padding, 15px): how many lessons will be created in semibold, closed days skipped in muted, the dates in muted tabular, and a warning-ink line when the cap is reached.

### Course Row
A course on the paper: 18px type icon and 17px semibold name, a 15px muted meta line (type · trainer, or "Senza trainer"), and a 14px muted tabular line "durata min · Max partecipanti N". A deleted course strikes its name through, mutes it and wears the danger tag. The action column holds one outline button: Modifica, or Ripristina when deleted. Deleting a course lives only in the edit dialog footer.

### Course Week Timetable (signature)
The course's schedule drawn as a printed timetable rather than listed as text: one equal column per weekday the gym is open, with 4px gaps. Each column has a 12px weekday-caps head in muted ink, then one chip per start time: giallino stock fill, stock ink, 13px bold tabular time, 6px corners, 4px vertical padding, stacked 4px apart. A day without lessons keeps its column with a 28px empty cell, so columns line up row to row and the eye can scan one weekday down the whole list. The giallino is the Courses section's own stock, used here as the timetable's paper.

### Course Form
Create and edit share one form in a dialog. The two panels (Dettagli, Schedulazione) are a segmented control under the header. Dettagli stacks name and description, then pairs the remaining fields two to a row (lesson type, with a preview of its icon on surface-sunken, beside trainer). Schedulazione has a 15px semibold heading over a 14px muted description, a weekday select, a time input and an outline add button (stacked on phones, one row from `sm`), then the slots grouped by weekday under 14px semibold day names: each slot is a 44px giallino chip (12px corners, 15px semibold tabular time, 12px left padding) ending in a 44px X button in danger ink with a danger-ground hover. The edit dialog footer is ghost-danger Elimina (left from `sm`), ghost Annulla, primary save with a pencil.

### Empty State
When a list has nothing to show it says so in place, on the paper: a 17px semibold title, one 15px muted sentence with the reason (and a different sentence when filters caused it), and text-link actions with chevrons for the ways out ("Torna al mese corrente", "Mostra tutte le lezioni"). No illustration and no card.

### To-do Item
A hairline-separated item: a 44px tile with 12px corners carrying either a 20px condensed count or a 20px icon on a semantic ground (warning for requests to confirm, info for attendance to mark, danger for a lesson about to auto-cancel), a 15px semibold title, a 15px muted sentence with its figures set tabular, and one text-link action. The column heading carries the total count in muted tabular figures.

### Next-Lesson Ticket (member)
The member's next booking as a lifted surface card (16px corners, 20px padding; 16px on phones) that links to its day in bookings. On phones it reads like a ticket: the 2rem time and a compact stamp face (date only) on top, the lesson name and meta at full width below; from `sm` it is a three-column row. Hover sinks to surface sunken.

### Charts
Recharts bar charts on the section paper, no frame: horizontal grid in surface border, no axis lines or ticks, 13px muted-ink labels, bars capped with `maxBarSize` (36px per type, 44px single series) and 4px top corners, a muted hover cursor. The tooltip is a 12px-radius surface panel with a hairline and the Sheet shadow, the bucket label in semibold ink, then one line per series with a 10px swatch, muted label and tabular ink value. A day stepper uses 44px icon links with muted hover around a 15px semibold date. Single-series charts name the series in the title and omit the legend; categorical charts end with a legend row of 12px swatches, including the hatch key.

### Lesson Row with In-Place Disclosure (signature)
Tapping a row's time or name opens it in place: the row gains the surface fill and Lift, and a detail list (time range, trainer, cancellation deadline, plan cost, access, seats) appears aligned to the lesson column. Every other row steps back to muted ink. Rows that cannot be acted on (started, access denied) are quiet too and state why in the action column. Nothing reorders.

### Person Row
A person on the paper (Users): a 44px initials avatar (14px bold, two letters) tinted with the role's stock in stock ink, a 17px semibold name over the email in 15px muted, then the person tags. A disabled account replaces the initials with a 16px lock on muted and mutes the name. The action column holds an outline Modifica with a pencil (from `sm`) and a 44px muted overflow menu (edit, Disattiva/Attiva, end sessions, message). Deleting a person lives only in the edit dialog footer; the edit dialog's panels are a segmented control under the header, and its footer follows the fixed dialog order (ghost-danger Elimina, ghost Annulla, primary save with a pencil).

### Notification Row
A message in the inbox: a 17px semibold subject, a 14px muted tabular date and time, then the body in 15px capped at 65ch; a 44px muted dismiss X in the right column. Read messages sit on the paper, hairline-separated. Unread ones are picked up: surface fill, Lift, 16px corners from `sm` (full-bleed on phones), and an 8px ink dot before the subject that is named for screen readers. Reading never reorders the list.

### Settings Section
One settings group as a block on the paper, never boxed: separated from the previous one by a hairline rule and 24px of space (the first has neither), an optional 17px semibold title with a 15px muted description capped at 65ch, an optional status note on the right, then its fields 16px apart. Omit the title when the surrounding tab already names the section. Settings pages are a single `max-w-2xl` column of these.

### Record Row (tappable)
Records that are edited rather than acted on in place (lesson types in registries, backups in danger zone) are whole-row buttons, at least 64px tall, hairline-separated, with a trailing 18px muted chevron and a surface-at-60% hover. A lesson type leads with a 44px tile (12px corners, its colour at 16% with its 22px icon); a backup shows its file name in 15px semibold mono over a 14px muted tabular date and size. Tapping opens the record's dialog, where the destructive action waits in the footer (a backup's dialog: ghost-danger delete on the left, primary Download).

**Lesson type appearance picker.** The lesson-type form chooses icon and colour by sight, never from a dropdown. A live preview on muted fill (16px corners, 16px padding) shows the 56px icon tile and the name as a list row ("Nome del tipo" in muted ink until typed). Icons: a radio grid of 44px cells (auto-fill, 6px gaps) in a hairline box that scrolls past 15rem; unchosen icons in muted ink, the chosen one in its colour on a tint with a 2px ink ring. Colours: a radio grid of 36px swatches in 44px targets; the chosen one carries a white check and a 2px ink ring offset by the surface. Both are native radio groups named in the gym's language ("Smeraldo", "Dumbbell 02"), with a visible focus ring.

### Outbox Row
A queued or failed message in the notification settings: a 44px checkbox target, then channel and status (13px tag) with a 14px muted tabular timestamp on one wrapping line, a 16px semibold subject, the recipient in 15px muted, the last error in 14px danger ink, and attempts with only the figure tabular. Retry is an outline button that goes icon-only below `sm`. Filters sit above in a two-column grid that becomes one row from `md`.

### Irreversible Reset
The danger zone's reset sits behind three locks in sequence: a danger-ground callout (12px corners, 18px alert icon, 15px semibold danger ink) stating what is lost, a field where the admin types RESET, and a six-digit OTP; the solid destructive button stays disabled until both are filled and then still opens an alert dialog.

### Report KPIs
A three-column definition list at every width: a 14px semibold muted term (15px from `sm`), the figure in ticket figures (1.75rem, 2.5rem from `sm`), and a trend line in 14px muted with a 16px trend icon (up, down, flat) and the signed delta in semibold tabular ink, followed from `sm` by the words "rispetto al periodo precedente". The trend is never carried by icon or colour alone.

### Report Table
Report data as a ruled section: a 17px heading, then from `sm` a table in 15px with 14px semibold muted column heads over a hairline; the first column is the row header in semibold; numeric columns are right-aligned and `.tabular`; rows separate by hairlines. On phones each row becomes a block titled by its first column in 16px semibold, with the other columns as a two-column list of muted terms and values. One emphasis exists: a cell over threshold (no-show at 30% or more) is set in semibold danger ink, with its figure still printed. Empty tables say so in a 15px muted sentence.

### Course Health Meters
Fill rate and no-show per course on one 0-100% scale: per course a 15px semibold name (a 12rem column from `sm`) and two stacked 8px pill meters on the muted track, fill rate in Chart Blue and no-show in muted ink, each followed by its value printed in a 3.5rem right-aligned tabular column. A legend with 20x8 pill swatches sits beside the heading. The meter is never the only carrier of the value.

### Sign-in Ticket
The auth card: surface, 24px corners, hairline, Lift (it is the one picked-up object on the page), 28px 20px padding (36px 32px from `sm`). Fields use `AuthField` (block label over the 44px input, 16px text). The single submit of each step is full width, 48px, 12px corners, 16px semibold on ink (`authSubmitClass`). Server results are an `AuthNotice`: a 12px-radius block on the danger or success ground with an 18px icon and 15px semibold words, announced as `alert` or `status`. Both switches are segmented links (the mode as a 2-column grid, the method as a 3-column grid) with the current option on surface with Lift.

### Quick Profile Popover
In staff lists (the lesson dialogs, pending approvals on the home) a person's name is a 44px-tall trigger with a dotted muted underline at 4px offset that turns solid on hover. It opens a Radix popover on tap, click or keyboard, never on hover alone: up to 20rem wide (the screen less 24px on phones), surface, hairline, 16px corners, Sheet shadow, 16px padding, 15px text. Inside: the name in 17px semibold, email and "member since" in 14px muted with the date tabular, then hairline-separated blocks of lessons by type and first and last lesson as muted terms over semibold tabular figures.

### Status Screen
404, error and global error speak as a single ticket on the lilla stock: the page paper with a lilla band (256px, 320px from `sm`) behind a centred surface card, 24px corners, hairline, Lift, up to 28rem. Inside, the figure ("404") as a 3.5rem bold ticket numeral in stock ink, a 22px bold title, one 16px muted sentence, and one way forward: a 48px primary link (12px corners, 16px semibold, full width on phones); error adds a 48px ghost retry beside it. Inside the app shell, `StatusBody` drops the card and band, since the page owns its band.

### Toasts and Banners
Toasts sit top centre: 16px corners, surface, hairline, Sheet shadow, 15px text, semantic icon colour. The Web Push banner floats above the tab bar on phones and bottom right on desktop, with a giallino icon tile and primary plus ghost actions. The PWA install banner is inline instead, under the home band: flat surface with a hairline, 16px corners, 16px padding, 15px semibold title over a 14px muted line, primary plus ghost actions beside it from `sm`.

## Do's and Don'ts

### Do:
- **Do** let the shell assign the stock: add the route to `STOCK_BY_KEY` and let `--stock` and `--paper` follow.
- **Do** set every time, count and date in `.tabular` (condensed `wdth` 74, tabular lining figures).
- **Do** keep row actions in a fixed right column and change state in place, 120–180ms ease-out.
- **Do** state the reason a row is blocked inside the row (full, access denied, started, cancellation closed).
- **Do** use dashed strokes to mean provisional, and only that.
- **Do** keep 44px targets, 16px input text, and bottom sheets for dialogs on phones.
- **Do** design both themes; check muted ink and stamp on every stock in light and dark.
- **Do** give every to-do item exactly one action, as a text-link action with a chevron.
- **Do** show seats as a seat strip (solid booked, dashed pending) rather than a percentage.
- **Do** colour chart categories by their lesson type, use `chart-1` for a single series, hatch scheduled lessons, and keep a legend for two or more series.
- **Do** dim behind overlays with the `overlay` token, never an ad-hoc black.
- **Do** put page filters in the band: independent filters as filter toggles (check icon plus ink stroke when on), exclusive choices as a segmented control.
- **Do** give every native select the `.ui-select` class.
- **Do** set status tags at 13px semibold on a semantic ground, and say why a lesson is modified ("Modificata: orario").
- **Do** draw a page's band with `PageBand` and build settings from `SettingsSection`, `SegmentedTabs`, `CheckRow` and `StatusNote`.
- **Do** name a confirm by its act (Elimina, Disattiva), and give deactivation and deletion the solid destructive fill.
- **Do** right-align numeric table columns in `.tabular`, and print every value a meter or bar shows.
- **Do** state plan usage as what is spent ("3/12 usate · mese") with "esaurito" in words at the limit.
- **Do** make a person's name in staff lists a quick-profile trigger that opens on tap or keyboard, not hover.

### Don't:
- **Don't** use stamp violet for anything but the user's own bookings (beyond focus ring, caret and control accent).
- **Don't** put content on a neutral grey ground; the field is the section paper.
- **Don't** add gradient washes, glass, or blur. The only gradients in the build are hard-stop marks: the punched centre of a used entry slot and the hatch key in the chart legend.
- **Don't** add shadow to lists, nav, inline banners, settings sections or ordinary cards; lift is for the pass, the sign-in ticket, the status ticket, the opened or in-progress row, the next-lesson card, an unread notification, the active tab or segment, and overlays.
- **Don't** use uppercase lettering outside a stamp face, a stamp chip and weekday abbreviations (the day strip, the course timetable heads); tracking belongs to the stamp alone.
- **Don't** use stamp violet or Chart Blue for seats, counts or to-do tiles; seats are ink, tiles are semantic grounds.
- **Don't** reorder rows or animate layout when state changes.
- **Don't** put cancel or delete buttons in list rows; they belong in the object's dialog footer behind a confirmation. The one row menu is removing a person, inside that lesson's own manage dialog.
- **Don't** use "standalone" in copy; a lesson outside any course is a "Lezione singola".
- **Don't** box settings groups in cards; separate them with rules.
- **Don't** set dates, sizes or counts in mono; mono is for codes only.
