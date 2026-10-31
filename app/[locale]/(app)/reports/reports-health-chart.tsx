type HealthRow = {
  courseName: string;
  fillRatePct: number;
  noShowRatePct: number;
};

type ReportsHealthChartProps = {
  rows: HealthRow[];
  locale: string;
  labels: {
    title: string;
    description: string;
    empty: string;
    fillRate: string;
    noShowRate: string;
  };
};

function Meter({ value, display, color, name, label }: { value: number; display: string; color: string; name: string; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-3">
      <span className="text-sm text-[var(--muted-foreground)]">{name}</span>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className="h-2 overflow-hidden rounded-full bg-[var(--muted)]"
      >
        <div className="h-full rounded-full" style={{ width: `${clamped}%`, background: color }} />
      </div>
      <span className="tabular text-right text-[15px]">{display}</span>
    </div>
  );
}

/**
 * Fill rate and no-show per course, both 0–100%: one row per course with two thin meters
 * on the same scale, values always printed (the meter is never the only carrier).
 */
export function ReportsHealthChart({ rows, labels, locale }: ReportsHealthChartProps) {
  const format = new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 1 });
  const pct = (value: number) => `${format.format(value)}%`;
  return (
    <section aria-labelledby="course-health-heading" className="border-t border-[var(--rule)] py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-prose">
          <h2 id="course-health-heading" className="text-[17px] font-semibold">{labels.title}</h2>
          <p className="mt-1 text-[15px] text-[var(--muted-foreground)]">{labels.description}</p>
        </div>
        {rows.length > 0 ? (
        <ul className="flex gap-4 text-sm">
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-2 w-5 rounded-full bg-[var(--chart-1)]" />
            {labels.fillRate}
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-2 w-5 rounded-full bg-[var(--muted-foreground)]" />
            {labels.noShowRate}
          </li>
        </ul>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-[15px] text-[var(--muted-foreground)]">{labels.empty}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {rows.map((row) => (
            <li key={row.courseName} className="grid gap-1.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
              <p className="text-[15px] font-semibold leading-snug">{row.courseName}</p>
              <div className="space-y-1.5">
                <Meter
                  value={row.fillRatePct}
                  display={pct(row.fillRatePct)}
                  color="var(--chart-1)"
                  name={labels.fillRate}
                  label={`${row.courseName} · ${labels.fillRate}`}
                />
                <Meter
                  value={row.noShowRatePct}
                  display={pct(row.noShowRatePct)}
                  color="var(--muted-foreground)"
                  name={labels.noShowRate}
                  label={`${row.courseName} · ${labels.noShowRate}`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
