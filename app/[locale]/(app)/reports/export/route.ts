import { getCurrentUser } from "@/lib/auth";
import { buildReportPdfDocument, type PdfReportTableSection } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";
import { REPORT_IDS, buildReportsSnapshot, parseReportDays, reportRangeForDays } from "@/lib/reports";
import { defaultLocale, isLocale } from "@/lib/i18n";

function weekdayLabel(locale: "it" | "en", weekday: string): string {
  const map = {
    MONDAY: { it: "Lunedi", en: "Monday" },
    TUESDAY: { it: "Martedi", en: "Tuesday" },
    WEDNESDAY: { it: "Mercoledi", en: "Wednesday" },
    THURSDAY: { it: "Giovedi", en: "Thursday" },
    FRIDAY: { it: "Venerdi", en: "Friday" },
    SATURDAY: { it: "Sabato", en: "Saturday" },
    SUNDAY: { it: "Domenica", en: "Sunday" },
  } as const;
  return map[weekday as keyof typeof map]?.[locale] ?? weekday;
}

function reportTitle(locale: "it" | "en", id: (typeof REPORT_IDS)[number]): string {
  if (id === "COURSE_POPULARITY") return locale === "it" ? "Report 1 - Corsi piu seguiti" : "Report 1 - Most attended courses";
  if (id === "TIME_CROWDING") return locale === "it" ? "Report 2 - Orari piu affollati" : "Report 2 - Most crowded time slots";
  if (id === "TRAINER_PERFORMANCE") return locale === "it" ? "Report 3 - Trainer piu seguiti" : "Report 3 - Most attended trainers";
  if (id === "NO_SHOW_ANALYTICS") return locale === "it" ? "Report 4 - Analisi no-show" : "Report 4 - No-show analytics";
  return locale === "it" ? "Report 3 - Trainer piu seguiti" : "Report 3 - Most attended trainers";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { locale: rawLocale } = await context.params;
  const safeLocale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const locale: "it" | "en" = safeLocale === "en" ? "en" : "it";
  const url = new URL(request.url);
  const days = parseReportDays(url.searchParams.get("days"));
  const { from, to } = reportRangeForDays(days);
  const snapshot = await buildReportsSnapshot(prisma, { from, to, days });
  const sections: PdfReportTableSection[] = [
    {
      title: locale === "it" ? "Riepilogo KPI" : "KPI summary",
      columns: [
        { label: locale === "it" ? "Lezioni" : "Lessons", widthChars: 12, align: "right" },
        { label: locale === "it" ? "Prenotazioni" : "Bookings", widthChars: 14, align: "right" },
        { label: locale === "it" ? "Riempimento" : "Fill rate", widthChars: 14, align: "right" },
      ],
      rows: [
        [
          String(snapshot.totals.lessonsCount),
          String(snapshot.totals.totalBookings),
          `${snapshot.totals.avgFillRatePct}%`,
        ],
      ],
    },
  ];

  for (const id of REPORT_IDS) {
    if (id === "COURSE_POPULARITY") {
      const rows = snapshot.coursePopularity.slice(0, 25);
      sections.push({
        title: reportTitle(locale, id),
        columns: [
          { label: locale === "it" ? "Corso" : "Course", widthChars: 28 },
          { label: locale === "it" ? "Lezioni" : "Lessons", widthChars: 9, align: "right" },
          { label: locale === "it" ? "Prenotazioni" : "Bookings", widthChars: 12, align: "right" },
          { label: "Fill %", widthChars: 8, align: "right" },
        ],
        rows:
          rows.length > 0
            ? rows.map((row) => [
                row.courseName,
                String(row.lessonsCount),
                String(row.totalBookings),
                `${row.fillRatePct}%`,
              ])
            : [[locale === "it" ? "Nessun dato" : "No data", "", "", ""]],
      });
      continue;
    }

    if (id === "TIME_CROWDING") {
      const rows = snapshot.timeCrowding.slice(0, 30);
      sections.push({
        title: reportTitle(locale, id),
        columns: [
          { label: locale === "it" ? "Giorno" : "Weekday", widthChars: 11 },
          { label: locale === "it" ? "Fascia" : "Slot", widthChars: 8 },
          { label: locale === "it" ? "Prenotazioni" : "Bookings", widthChars: 12, align: "right" },
          { label: locale === "it" ? "Capienza" : "Capacity", widthChars: 10, align: "right" },
          { label: "Fill %", widthChars: 8, align: "right" },
        ],
        rows:
          rows.length > 0
            ? rows.map((row) => [
                `${weekdayLabel(locale, row.weekday)}`,
                row.slotLabel,
                String(row.totalBookings),
                String(row.totalCapacity),
                `${row.fillRatePct}%`,
              ])
            : [[locale === "it" ? "Nessun dato" : "No data", "", "", "", ""]],
      });
      continue;
    }

    if (id === "TRAINER_PERFORMANCE") {
      const rows = snapshot.trainerPerformance.slice(0, 25);
      sections.push({
        title: reportTitle(locale, id),
        columns: [
          { label: "Trainer", widthChars: 24 },
          { label: locale === "it" ? "Lezioni" : "Lessons", widthChars: 9, align: "right" },
          { label: locale === "it" ? "Prenotazioni" : "Bookings", widthChars: 12, align: "right" },
          { label: locale === "it" ? "Allievi unici" : "Unique trainees", widthChars: 14, align: "right" },
          { label: "Fill %", widthChars: 8, align: "right" },
        ],
        rows:
          rows.length > 0
            ? rows.map((row) => [
                row.trainerName,
                String(row.lessonsCount),
                String(row.totalBookings),
                String(row.uniqueTrainees),
                `${row.fillRatePct}%`,
              ])
            : [[locale === "it" ? "Nessun dato" : "No data", "", "", "", ""]],
      });
      continue;
    }

    const rows = snapshot.noShowAnalytics.slice(0, 25);
    sections.push({
      title: reportTitle(locale, id),
      columns: [
        { label: "Trainee", widthChars: 24 },
        { label: locale === "it" ? "Prenotazioni" : "Bookings", widthChars: 12, align: "right" },
        { label: "No-show", widthChars: 9, align: "right" },
        { label: locale === "it" ? "Tasso %" : "Rate %", widthChars: 9, align: "right" },
      ],
      rows:
        rows.length > 0
          ? rows.map((row) => [
              row.traineeName,
              String(row.totalBookings),
              String(row.noShowCount),
              `${row.noShowRatePct}%`,
            ])
          : [[locale === "it" ? "Nessun dato" : "No data", "", "", ""]],
    });
  }

  const pdf = buildReportPdfDocument({
    title: locale === "it" ? "NekoGym - Report gestionali" : "NekoGym - Management reports",
    subtitle: locale === "it" ? `Periodo analisi: ultimi ${days} giorni` : `Analysis period: last ${days} days`,
    generatedAtLabel:
      locale === "it"
        ? `Generato il: ${snapshot.range.generatedAt.toLocaleString("it-IT")}`
        : `Generated at: ${snapshot.range.generatedAt.toLocaleString("en-US")}`,
    sections,
  });
  const fileName = `nekogym-reports-${days}d.pdf`;

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
