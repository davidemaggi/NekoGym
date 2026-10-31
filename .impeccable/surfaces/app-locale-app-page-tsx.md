---
version: 1
slug: "app-locale-app-page-tsx"
primary_target: "app/[locale]/(app)/page.tsx"
related_targets: ["app/[locale]/(app)/dashboard-type-chart.tsx","app/[locale]/(app)/dashboard-crowding-chart.tsx","app/[locale]/(app)/dashboard-pending-approvals.tsx"]
---

# Home (dashboard) — per-role landing inside the "Abbonamento" world

Mode: Operate. Inherits DESIGN.md; no new identity.

Audience and job: staff arrive in the morning and need the day's lessons and what needs action; members want their pass, their next lesson and a way to book. One home per role (user decision). Staff layout: today left, to-do right on desktop; stacked on phones (to-do first when it has items). Removed from home (user decision): per-type ranking and total time. Kept: lessons-per-type chart, crowding chart (staff).

## Direction contract

THESIS: The home is the day's timetable plus the desk's to-do pile, set in the same fixed-time rows as Bookings. Refuses the KPI-tile dashboard (big number, small label, four cards).

OWN-WORLD: DESIGN.md as is: carta stock band for the greeting, rows on paper with --rule hairlines, condensed tabular times, seat strip (one segment per seat) in ink, to-do items as tinted count tiles (warning/info/danger). Stamp violet only on the member's own bookings.

STORY: Staff see how many lessons and people today, scan the rows by time, open a lesson to manage or mark attendance, and clear the to-do list (requests, attendance, lessons about to auto-cancel). Members see remaining entries, their next lesson stamped, what comes later, and book.

FIRST VIEWPORT: Staff desktop: band with greeting and "day · N lessons · M booked"; left column rows (time, name+meta, seat strip, Gestisci/Presenze), the in-progress row lifted white; right column Da fare with count tiles and inline actions. Member phone: band with greeting, date and pass card; next lesson as a lifted row with stamp; later list; Prenota CTA.

FORM: Righe a orario fisso, candidate 1 of 7 on the grounded list, dealt third. seed:858dcd7fcc65667f.

Signature interaction: the seat strip fills one segment per booked seat; opening a row uses the shared lesson dialog. Motion: 150ms colour transitions only.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
