import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { buildReportsSnapshot, parseReportDays, parseSelectedReportIds, reportRangeForDays } from "@/lib/reports";
import { updateReportDeliverySettingsAction } from "@/app/[locale]/(app)/reports/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsHealthChart } from "@/app/[locale]/(app)/reports/reports-health-chart";

function trendDelta(current: number, previous: number): { deltaPct: number; sign: "up" | "down" | "flat" } {
  if (previous <= 0) return { deltaPct: 0, sign: "flat" };
  const raw = ((current - previous) / previous) * 100;
  const rounded = Math.round(raw * 10) / 10;
  if (rounded > 0.1) return { deltaPct: rounded, sign: "up" };
  if (rounded < -0.1) return { deltaPct: rounded, sign: "down" };
  return { deltaPct: rounded, sign: "flat" };
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
  const fillTrend = trendDelta(snapshot.totals.avgFillRatePct, previousSnapshot.totals.avgFillRatePct);
  const topNoShow = snapshot.noShowAnalytics[0] ?? null;
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

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--surface-border)] p-3">
        <form method="get" className="flex items-center gap-2">
          <label htmlFor="days" className="text-sm font-medium">
            {labels.filters.periodLabel}
          </label>
          <select id="days" name="days" defaultValue={String(days)} className="rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-2 py-1 text-sm">
            <option value="7">{labels.filters.last7Days}</option>
            <option value="30">{labels.filters.last30Days}</option>
            <option value="90">{labels.filters.last90Days}</option>
          </select>
          <button type="submit" className="rounded-md border border-[var(--surface-border)] px-3 py-1 text-sm">
            {labels.filters.applyCta}
          </button>
        </form>

        <a
          href={`/${safeLocale}/reports/export?days=${days}`}
          className="rounded-md border border-[var(--surface-border)] px-3 py-1 text-sm"
        >
          {labels.exportPdfCta}
        </a>
      </div>

      {saved === "1" ? (
        <p className="rounded-md border border-emerald-300/40 bg-emerald-100/40 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200">
          {labels.settings.savedMessage}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{labels.kpis.lessonsCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{snapshot.totals.lessonsCount}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {labels.trendLabel}: {lessonsTrend.deltaPct > 0 ? "+" : ""}{lessonsTrend.deltaPct}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{labels.kpis.totalBookings}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{snapshot.totals.totalBookings}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {labels.trendLabel}: {bookingsTrend.deltaPct > 0 ? "+" : ""}{bookingsTrend.deltaPct}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{labels.kpis.avgFillRate}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{snapshot.totals.avgFillRatePct}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {labels.trendLabel}: {fillTrend.deltaPct > 0 ? "+" : ""}{fillTrend.deltaPct}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{labels.executiveTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {topCourse
              ? labels.executiveTopCourse
                .replace("{course}", topCourse.courseName)
                .replace("{bookings}", String(topCourse.totalBookings))
              : labels.empty}
          </p>
          <p>
            {busiestSlot
              ? labels.executiveBusiestSlot
                .replace("{weekday}", labels.weekdays[busiestSlot.weekday])
                .replace("{time}", busiestSlot.slotLabel)
                .replace("{fill}", `${busiestSlot.fillRatePct}%`)
              : labels.empty}
          </p>
          <p>
            {topNoShow
              ? labels.executiveTopNoShow
                .replace("{name}", topNoShow.traineeName)
                .replace("{rate}", `${topNoShow.noShowRatePct}%`)
                .replace("{count}", String(topNoShow.noShowCount))
              : labels.empty}
          </p>
        </CardContent>
      </Card>

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
      />

      <Card>
        <CardHeader>
          <CardTitle>{labels.sections.coursePopularityTitle}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-[var(--surface-border)] text-left">
                <th className="py-2 pr-2">{labels.columns.course}</th>
                <th className="py-2 pr-2">{labels.columns.lessons}</th>
                <th className="py-2 pr-2">{labels.columns.bookings}</th>
                <th className="py-2 pr-2">{labels.columns.avgAttendees}</th>
                <th className="py-2 pr-2">{labels.columns.fillRate}</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.coursePopularity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-[var(--muted-foreground)]">
                    {labels.empty}
                  </td>
                </tr>
              ) : (
                snapshot.coursePopularity.map((row) => (
                  <tr key={row.courseId} className="border-b border-[var(--surface-border)]/60">
                    <td className="py-2 pr-2">{row.courseName}</td>
                    <td className="py-2 pr-2">{row.lessonsCount}</td>
                    <td className="py-2 pr-2">{row.totalBookings}</td>
                    <td className="py-2 pr-2">{row.avgAttendees}</td>
                    <td className="py-2 pr-2">{row.fillRatePct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.sections.timeCrowdingTitle}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-[var(--surface-border)] text-left">
                <th className="py-2 pr-2">{labels.columns.weekday}</th>
                <th className="py-2 pr-2">{labels.columns.time}</th>
                <th className="py-2 pr-2">{labels.columns.lessons}</th>
                <th className="py-2 pr-2">{labels.columns.bookings}</th>
                <th className="py-2 pr-2">{labels.columns.fillRate}</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.timeCrowding.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-[var(--muted-foreground)]">
                    {labels.empty}
                  </td>
                </tr>
              ) : (
                snapshot.timeCrowding.map((row) => (
                  <tr key={`${row.weekday}-${row.hour}`} className="border-b border-[var(--surface-border)]/60">
                    <td className="py-2 pr-2">{labels.weekdays[row.weekday]}</td>
                    <td className="py-2 pr-2">{row.slotLabel}</td>
                    <td className="py-2 pr-2">{row.lessonsCount}</td>
                    <td className="py-2 pr-2">
                      {row.totalBookings}/{row.totalCapacity}
                    </td>
                    <td className="py-2 pr-2">{row.fillRatePct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.sections.trainerPerformanceTitle}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-[var(--surface-border)] text-left">
                <th className="py-2 pr-2">{labels.columns.trainer}</th>
                <th className="py-2 pr-2">{labels.columns.lessons}</th>
                <th className="py-2 pr-2">{labels.columns.bookings}</th>
                <th className="py-2 pr-2">{labels.columns.uniqueTrainees}</th>
                <th className="py-2 pr-2">{labels.columns.avgAttendees}</th>
                <th className="py-2 pr-2">{labels.columns.fillRate}</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.trainerPerformance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-3 text-[var(--muted-foreground)]">
                    {labels.empty}
                  </td>
                </tr>
              ) : (
                snapshot.trainerPerformance.map((row) => (
                  <tr key={row.trainerId} className="border-b border-[var(--surface-border)]/60">
                    <td className="py-2 pr-2">{row.trainerName}</td>
                    <td className="py-2 pr-2">{row.lessonsCount}</td>
                    <td className="py-2 pr-2">{row.totalBookings}</td>
                    <td className="py-2 pr-2">{row.uniqueTrainees}</td>
                    <td className="py-2 pr-2">{row.avgAttendees}</td>
                    <td className="py-2 pr-2">{row.fillRatePct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.sections.noShowAnalyticsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[var(--surface-border)] text-left">
                <th className="py-2 pr-2">{labels.columns.trainee}</th>
                <th className="py-2 pr-2">{labels.columns.bookings}</th>
                <th className="py-2 pr-2">{labels.columns.markedAttendances}</th>
                <th className="py-2 pr-2">{labels.columns.present}</th>
                <th className="py-2 pr-2">{labels.columns.noShow}</th>
                <th className="py-2 pr-2">{labels.columns.noShowRate}</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.noShowAnalytics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-3 text-[var(--muted-foreground)]">
                    {labels.empty}
                  </td>
                </tr>
              ) : (
                snapshot.noShowAnalytics.map((row) => (
                  <tr key={row.traineeId} className="border-b border-[var(--surface-border)]/60">
                    <td className="py-2 pr-2">{row.traineeName}</td>
                    <td className="py-2 pr-2">{row.totalBookings}</td>
                    <td className="py-2 pr-2">{row.markedAttendances}</td>
                    <td className="py-2 pr-2">{row.presentCount}</td>
                    <td className="py-2 pr-2">{row.noShowCount}</td>
                    <td className={["py-2 pr-2", row.noShowRatePct >= 30 ? "font-semibold text-[var(--danger-fg)]" : ""].join(" ")}>
                      {row.noShowRatePct}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.settings.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">{labels.settings.description}</p>
          <form action={updateReportDeliverySettingsAction} className="space-y-3">
            <input type="hidden" name="locale" value={safeLocale} />
            <input type="hidden" name="days" value={days} />

            <div className="space-y-1">
              <label htmlFor="reportDigestFrequency" className="text-sm font-medium">
                {labels.settings.frequencyLabel}
              </label>
              <select
                id="reportDigestFrequency"
                name="reportDigestFrequency"
                defaultValue={settings?.reportDigestFrequency ?? "NEVER"}
                className="rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-2 py-1 text-sm"
              >
                <option value="NEVER">{labels.settings.frequencyNever}</option>
                <option value="WEEKLY">{labels.settings.frequencyWeekly}</option>
                <option value="MONTHLY">{labels.settings.frequencyMonthly}</option>
              </select>
            </div>

            <fieldset className="space-y-1">
              <legend className="text-sm font-medium">{labels.settings.reportsLabel}</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="reportIds"
                  value="COURSE_POPULARITY"
                  defaultChecked={selectedReportIds.includes("COURSE_POPULARITY")}
                />
                {labels.sections.coursePopularityTitle}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="reportIds"
                  value="TIME_CROWDING"
                  defaultChecked={selectedReportIds.includes("TIME_CROWDING")}
                />
                {labels.sections.timeCrowdingTitle}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="reportIds"
                  value="TRAINER_PERFORMANCE"
                  defaultChecked={selectedReportIds.includes("TRAINER_PERFORMANCE")}
                />
                {labels.sections.trainerPerformanceTitle}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="reportIds"
                  value="NO_SHOW_ANALYTICS"
                  defaultChecked={selectedReportIds.includes("NO_SHOW_ANALYTICS")}
                />
                {labels.sections.noShowAnalyticsTitle}
              </label>
            </fieldset>

            {settings?.reportDigestLastSentAt ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                {labels.settings.lastSentLabel}: {new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(settings.reportDigestLastSentAt)}
              </p>
            ) : null}

            <button type="submit" className="rounded-md border border-[var(--surface-border)] px-3 py-1 text-sm">
              {labels.settings.saveCta}
            </button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
