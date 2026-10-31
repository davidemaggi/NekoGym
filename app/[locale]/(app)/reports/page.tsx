import type { ReactNode } from "react";
import Link from "next/link";
import { FileDown, Minus, TrendingDown, TrendingUp } from "lucide-react";

import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { buildReportsSnapshot, parseReportDays, parseSelectedReportIds, reportRangeForDays } from "@/lib/reports";
import { updateReportDeliverySettingsAction } from "@/app/[locale]/(app)/reports/actions";

import { PageBand } from "@/components/layout/page-band";
import { CheckRow, SettingsSection, StatusNote } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatDateTimeForApp } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import { ReportTable } from "@/app/[locale]/(app)/reports/report-table";
import { ReportsHealthChart } from "@/app/[locale]/(app)/reports/reports-health-chart";

type Trend = { delta: number; sign: "up" | "down" | "flat" | "none"; unit: "pct" | "pt" };

/** Relative change for counts; with no previous data there is no trend to claim. */
function trendDelta(current: number, previous: number): Trend {
  if (previous <= 0) return { delta: 0, sign: "none", unit: "pct" };
  const rounded = Math.round(((current - previous) / previous) * 1000) / 10;
  return { delta: rounded, sign: rounded > 0.1 ? "up" : rounded < -0.1 ? "down" : "flat", unit: "pct" };
}

/** Change of a rate, in percentage points (never a percent of a percent). */
function pointsDelta(current: number, previous: number, hadPrevious: boolean): Trend {
  if (!hadPrevious) return { delta: 0, sign: "none", unit: "pt" };
  const rounded = Math.round((current - previous) * 10) / 10;
  return { delta: rounded, sign: rounded > 0.1 ? "up" : rounded < -0.1 ? "down" : "flat", unit: "pt" };
}

/** Fills "{key}" placeholders of a sentence with nodes, so figures can be set apart. */
function fillTemplate(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = part.match(/^\{(\w+)\}$/)?.[1];
    return key && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ days?: string; saved?: string }>;
}) {
  const { locale } = await params;
  const { days: daysRaw, saved } = await searchParams;
  const user = await requireAnyRole(["ADMIN"], locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).appPages.reports;
  const days = parseReportDays(daysRaw);
  const { from, to } = reportRangeForDays(days);
  const snapshot = await buildReportsSnapshot(prisma, { from, to, days });
  const previousTo = new Date(from);
  const previousFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
  const previousSnapshot = await buildReportsSnapshot(prisma, { from: previousFrom, to: previousTo, days });
  const lessonsTrend = trendDelta(snapshot.totals.lessonsCount, previousSnapshot.totals.lessonsCount);
  const bookingsTrend = trendDelta(snapshot.totals.totalBookings, previousSnapshot.totals.totalBookings);
  const fillTrend = pointsDelta(
    snapshot.totals.avgFillRatePct,
    previousSnapshot.totals.avgFillRatePct,
    previousSnapshot.totals.lessonsCount > 0
  );
  // A no-show leader only exists once someone was actually marked absent.
  const topNoShow = snapshot.noShowAnalytics.find((row) => row.noShowCount > 0) ?? null;
  const numberFormat = new Intl.NumberFormat(safeLocale === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 1 });
  const num = (value: number) => numberFormat.format(value);
  const pct = (value: number) => `${numberFormat.format(value)}%`;
  const fig = (text: string) => <span className="tabular">{text}</span>;
  const topCourse = snapshot.coursePopularity[0] ?? null;
  const busiestSlot = snapshot.timeCrowding[0] ?? null;
  const settings = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      reportDigestFrequency: true,
      reportDigestReportsCsv: true,
      reportDigestLastSentAt: true,
    },
  });
  const selectedReportIds = parseSelectedReportIds(settings?.reportDigestReportsCsv ?? null);

  const periods: Array<[number, string]> = [
    [7, labels.filters.last7Days],
    [30, labels.filters.last30Days],
    [90, labels.filters.last90Days],
  ];
  const kpis: Array<{ label: string; value: string; trend: Trend }> = [
    { label: labels.kpis.lessonsCount, value: num(snapshot.totals.lessonsCount), trend: lessonsTrend },
    { label: labels.kpis.totalBookings, value: num(snapshot.totals.totalBookings), trend: bookingsTrend },
    { label: labels.kpis.avgFillRate, value: pct(snapshot.totals.avgFillRatePct), trend: fillTrend },
  ];
  const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus, none: Minus } as const;
  const trendText = (trend: Trend) =>
    `${trend.delta > 0 ? "+" : ""}${num(trend.delta)}${trend.unit === "pt" ? ` ${labels.pointsUnit}` : "%"}`;
  const highlights: Array<{ key: string; content: ReactNode[] }> = [];
  if (topCourse) {
    highlights.push({
      key: "course",
      content: fillTemplate(labels.executiveTopCourse, { course: topCourse.courseName, bookings: fig(num(topCourse.totalBookings)) }),
    });
  }
  if (busiestSlot) {
    highlights.push({
      key: "slot",
      content: fillTemplate(labels.executiveBusiestSlot, {
        weekday: labels.weekdays[busiestSlot.weekday],
        time: fig(busiestSlot.slotLabel),
        fill: fig(pct(busiestSlot.fillRatePct)),
      }),
    });
  }
  if (topNoShow) {
    highlights.push({
      key: "noShow",
      content: fillTemplate(labels.executiveTopNoShow, {
        name: topNoShow.traineeName,
        rate: fig(pct(topNoShow.noShowRatePct)),
        count: fig(num(topNoShow.noShowCount)),
      }),
    });
  }
  const digestReports = [
    ["COURSE_POPULARITY", labels.sections.coursePopularityTitle],
    ["TIME_CROWDING", labels.sections.timeCrowdingTitle],
    ["TRAINER_PERFORMANCE", labels.sections.trainerPerformanceTitle],
    ["NO_SHOW_ANALYTICS", labels.sections.noShowAnalyticsTitle],
  ] as const;

  return (
    <div className="space-y-5">
      <PageBand
        title={labels.title}
        description={labels.description}
        action={
          <a
            href={`/${safeLocale}/reports/export?days=${days}`}
            aria-label={labels.exportPdfCta}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl border-[1.5px] border-[var(--foreground)] bg-[var(--surface)] text-[15px] font-semibold hover:bg-[var(--muted)] sm:w-auto sm:px-4"
          >
            <FileDown size={18} aria-hidden="true" />
            <span className="hidden sm:inline">{labels.exportPdfCta}</span>
          </a>
        }
      >
        <nav aria-label={labels.filters.periodLabel} className="mt-5 inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-[var(--muted)] p-1">
          {periods.map(([value, label]) => (
            <Link
              key={value}
              href={`/${safeLocale}/reports?days=${value}`}
              aria-current={days === value ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center rounded-lg px-3.5 text-[15px] font-semibold transition-colors",
                days === value
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </PageBand>

      {saved === "1" ? <StatusNote tone="ok">{labels.settings.savedMessage}</StatusNote> : null}

      <div className="max-w-5xl">
        <dl className="grid grid-cols-3 grid-rows-[auto_auto_auto] gap-x-3 pb-6 sm:gap-x-6">
          {kpis.map((kpi) => {
            const Icon = TREND_ICON[kpi.trend.sign];
            return (
              <div key={kpi.label} className="row-span-3 grid min-w-0 grid-rows-subgrid">
                <dt className="self-end text-sm font-semibold text-[var(--muted-foreground)] sm:text-[15px]">{kpi.label}</dt>
                <dd className="tabular mt-1 text-[1.75rem] font-bold leading-none sm:text-[2.5rem]">{kpi.value}</dd>
                <dd className="mt-2 flex items-start gap-1 text-sm text-[var(--muted-foreground)]">
                  {kpi.trend.sign === "none" ? (
                    // Phones get the bare dash; the full reason is read out and shown from sm.
                    <span>
                      <span aria-hidden="true" className="sm:hidden">—</span>
                      <span className="sr-only sm:not-sr-only">{labels.trendNoPrevious}</span>
                    </span>
                  ) : (
                    <>
                    <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                    <span>
                      <span className="tabular font-semibold text-[var(--foreground)]">{trendText(kpi.trend)}</span>{" "}
                      <span className="sm:hidden">{labels.trendShort}</span>
                      <span className="hidden sm:inline">{labels.trendLabel}</span>
                    </span>
                    </>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>

        <section aria-labelledby="highlights-heading" className="border-t border-[var(--rule)] py-6">
          <h2 id="highlights-heading" className="text-[17px] font-semibold">{labels.executiveTitle}</h2>
          {highlights.length === 0 ? (
            <p className="mt-3 text-[15px] text-[var(--muted-foreground)]">{labels.empty}</p>
          ) : (
            <ul className="mt-3 max-w-prose list-disc space-y-1.5 pl-5 text-[16px]">
              {highlights.map((line) => (
                <li key={line.key}>{line.content}</li>
              ))}
            </ul>
          )}
        </section>

        <ReportsHealthChart
          rows={snapshot.courseHealth.slice(0, 8).map((row) => ({
            courseName: row.courseName,
            fillRatePct: row.fillRatePct,
            noShowRatePct: row.noShowRatePct,
          }))}
          labels={{
            title: labels.sections.courseHealthChartTitle,
            description: labels.sections.courseHealthChartDescription,
            empty: labels.empty,
            fillRate: labels.columns.fillRate,
            noShowRate: labels.columns.noShowRate,
          }}
          locale={safeLocale}
        />

        <ReportTable
          title={labels.sections.coursePopularityTitle}
          empty={labels.empty}
          rows={snapshot.coursePopularity}
          rowKey={(row) => row.courseId}
          columns={[
            { key: "course", label: labels.columns.course, render: (row) => row.courseName },
            { key: "lessons", label: labels.columns.lessons, numeric: true, render: (row) => row.lessonsCount },
            { key: "bookings", label: labels.columns.bookings, numeric: true, render: (row) => row.totalBookings },
            { key: "avg", label: labels.columns.avgAttendees, numeric: true, render: (row) => num(row.avgAttendees) },
            { key: "fill", label: labels.columns.fillRate, numeric: true, render: (row) => pct(row.fillRatePct) },
          ]}
        />

        <ReportTable
          title={labels.sections.timeCrowdingTitle}
          empty={labels.empty}
          rows={snapshot.timeCrowding}
          rowKey={(row) => `${row.weekday}-${row.hour}`}
          columns={[
            { key: "slot", label: labels.columns.time, render: (row) => (
                <>
                  {labels.weekdays[row.weekday]} <span className="tabular">{row.slotLabel}</span>
                </>
              ) },
            { key: "lessons", label: labels.columns.lessons, numeric: true, render: (row) => row.lessonsCount },
            { key: "bookings", label: labels.columns.bookings, numeric: true, render: (row) => `${row.totalBookings}/${row.totalCapacity}` },
            { key: "fill", label: labels.columns.fillRate, numeric: true, render: (row) => pct(row.fillRatePct) },
          ]}
        />

        <ReportTable
          title={labels.sections.trainerPerformanceTitle}
          empty={labels.empty}
          rows={snapshot.trainerPerformance}
          rowKey={(row) => row.trainerId}
          columns={[
            { key: "trainer", label: labels.columns.trainer, render: (row) => row.trainerName },
            { key: "lessons", label: labels.columns.lessons, numeric: true, render: (row) => row.lessonsCount },
            { key: "bookings", label: labels.columns.bookings, numeric: true, render: (row) => row.totalBookings },
            { key: "unique", label: labels.columns.uniqueTrainees, numeric: true, render: (row) => row.uniqueTrainees },
            { key: "avg", label: labels.columns.avgAttendees, numeric: true, render: (row) => num(row.avgAttendees) },
            { key: "fill", label: labels.columns.fillRate, numeric: true, render: (row) => pct(row.fillRatePct) },
          ]}
        />

        <ReportTable
          title={labels.sections.noShowAnalyticsTitle}
          empty={labels.empty}
          rows={snapshot.noShowAnalytics}
          rowKey={(row) => row.traineeId}
          columns={[
            { key: "trainee", label: labels.columns.trainee, render: (row) => row.traineeName },
            { key: "bookings", label: labels.columns.bookings, numeric: true, render: (row) => row.totalBookings },
            { key: "marked", label: labels.columns.markedAttendances, numeric: true, render: (row) => row.markedAttendances },
            { key: "present", label: labels.columns.present, numeric: true, render: (row) => row.presentCount },
            { key: "noShow", label: labels.columns.noShow, numeric: true, render: (row) => row.noShowCount },
            {
              key: "rate",
              label: labels.columns.noShowRate,
              numeric: true,
              // Without marked attendance there is no rate: never show it as a perfect 0%.
              render: (row) => (row.markedAttendances === 0 ? "—" : pct(row.noShowRatePct)),
              emphasize: (row) => row.markedAttendances > 0 && row.noShowRatePct >= 30,
            },
          ]}
        />

        <SettingsSection title={labels.settings.title} description={labels.settings.description}>
          <form action={updateReportDeliverySettingsAction} className="space-y-4">
            <input type="hidden" name="locale" value={safeLocale} />
            <input type="hidden" name="days" value={days} />
            <div className="space-y-1.5">
              <Label htmlFor="reportDigestFrequency">{labels.settings.frequencyLabel}</Label>
              <select
                id="reportDigestFrequency"
                name="reportDigestFrequency"
                defaultValue={settings?.reportDigestFrequency ?? "NEVER"}
                className="ui-select w-full sm:max-w-xs"
              >
                <option value="NEVER">{labels.settings.frequencyNever}</option>
                <option value="WEEKLY">{labels.settings.frequencyWeekly}</option>
                <option value="MONTHLY">{labels.settings.frequencyMonthly}</option>
              </select>
            </div>
            <fieldset>
              <legend className="text-sm font-semibold">{labels.settings.reportsLabel}</legend>
              <div className="mt-1 grid sm:grid-cols-2 sm:gap-x-6">
                {digestReports.map(([id, label]) => (
                  <CheckRow key={id} name="reportIds" value={id} defaultChecked={selectedReportIds.includes(id)}>
                    {label}
                  </CheckRow>
                ))}
              </div>
            </fieldset>
            {settings?.reportDigestLastSentAt ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {labels.settings.lastSentLabel}:{" "}
                <span className="tabular">
                  {formatDateTimeForApp(settings.reportDigestLastSentAt, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            ) : null}
            <Button type="submit">{labels.settings.saveCta}</Button>
          </form>
        </SettingsSection>
      </div>
    </div>
  );
}
