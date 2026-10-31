"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type RangeView = "week" | "month" | "year";

export type TypeChartLesson = {
  startsAt: string;
  lessonTypeName: string;
  lessonTypeColor: string | null;
};

type DashboardTypeChartProps = {
  locale: string;
  /** Members open on the week around today, where their upcoming bookings sit. */
  defaultRange?: RangeView;
  lessons: TypeChartLesson[];
  labels: {
    chartTitle: string;
    chartDescription: string;
    chartRangeLabel: string;
    chartRangeWeek: string;
    chartRangeMonth: string;
    chartRangeYear: string;
    chartEmpty: string;
    chartFutureSuffix: string;
    chartFutureNote: string;
  };
};

// Fallback hues only for lesson types without an admin colour; colours follow the type, never its rank.
// (No violets: that hue is reserved for the stamp.)
const FALLBACK = ["#3b5fc4", "#059669", "#db2777", "#d97706", "#0d9488", "#0891b2"];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

/** Lessons per type over a week / month / year: done lessons solid, scheduled ones hatched. */
export function DashboardTypeChart({ locale, lessons, labels, defaultRange = "month" }: DashboardTypeChartProps) {
  const [range, setRange] = useState<RangeView>(defaultRange);
  const intlLocale = locale === "it" ? "it-IT" : "en-GB";

  const chart = useMemo(() => {
    const now = new Date();
    const types: Array<{ type: string; key: string; color: string }> = [];
    for (const lesson of lessons) {
      if (types.some((item) => item.type === lesson.lessonTypeName)) continue;
      types.push({
        type: lesson.lessonTypeName,
        key: `t${types.length}`,
        color: lesson.lessonTypeColor || FALLBACK[types.length % FALLBACK.length],
      });
    }

    const config: ChartConfig = {};
    for (const item of types) {
      config[`${item.key}Past`] = { label: item.type, color: item.color };
      config[`${item.key}Future`] = { label: `${item.type} · ${labels.chartFutureSuffix}`, color: item.color };
    }

    // Buckets are pre-built in order, so the axis never depends on which buckets hold data.
    type Row = { label: string } & Record<string, number | string>;
    const buckets = new Map<string, Row>();
    const emptyRow = (label: string): Row => {
      const row: Row = { label };
      for (const item of types) {
        row[`${item.key}Past`] = 0;
        row[`${item.key}Future`] = 0;
      }
      return row;
    };

    const short = new Intl.DateTimeFormat(intlLocale, { weekday: "short", day: "numeric" });
    const dayMonth = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" });
    const monthName = new Intl.DateTimeFormat(intlLocale, { month: "short" });
    let bucketOf: (date: Date) => string | null;

    if (range === "week") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
      for (let i = 0; i < 7; i += 1) {
        const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        buckets.set(dayKey(day), emptyRow(short.format(day)));
      }
      bucketOf = (date) => dayKey(date);
    } else if (range === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      for (let week = startOfWeek(monthStart); week <= monthEnd; week = new Date(week.getFullYear(), week.getMonth(), week.getDate() + 7)) {
        const weekEnd = new Date(week.getFullYear(), week.getMonth(), week.getDate() + 6);
        const from = week < monthStart ? monthStart : week;
        const to = weekEnd > monthEnd ? monthEnd : weekEnd;
        buckets.set(dayKey(week), emptyRow(`${dayMonth.format(from)}–${dayMonth.format(to)}`));
      }
      bucketOf = (date) =>
        date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? dayKey(startOfWeek(date)) : null;
    } else {
      for (let month = 0; month < 12; month += 1) {
        buckets.set(String(month), emptyRow(monthName.format(new Date(now.getFullYear(), month, 1))));
      }
      bucketOf = (date) => (date.getFullYear() === now.getFullYear() ? String(date.getMonth()) : null);
    }

    let total = 0;
    for (const lesson of lessons) {
      const date = new Date(lesson.startsAt);
      const key = bucketOf(date);
      const row = key ? buckets.get(key) : undefined;
      const type = types.find((item) => item.type === lesson.lessonTypeName);
      if (!row || !type) continue;
      const field = `${type.key}${date >= now ? "Future" : "Past"}`;
      row[field] = Number(row[field]) + 1;
      total += 1;
    }

    return { rows: Array.from(buckets.values()), config, types, total };
  }, [lessons, range, intlLocale, labels.chartFutureSuffix]);

  const ranges: Array<[RangeView, string]> = [
    ["week", labels.chartRangeWeek],
    ["month", labels.chartRangeMonth],
    ["year", labels.chartRangeYear],
  ];

  return (
    <section aria-labelledby="type-chart-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="type-chart-heading" className="text-[17px] font-semibold">{labels.chartTitle}</h2>
          <p className="mt-0.5 text-[15px] text-[var(--muted-foreground)]">{labels.chartDescription}</p>
        </div>
        <div role="group" aria-label={labels.chartRangeLabel} className="inline-flex rounded-xl bg-[var(--muted)] p-1">
          {ranges.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={cn(
                "h-11 rounded-lg px-3.5 text-[15px] font-semibold transition-colors",
                range === value
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {chart.total === 0 ? (
        <p className="mt-4 text-[15px] text-[var(--muted-foreground)]">{labels.chartEmpty}</p>
      ) : (
        <>
          <ChartContainer config={chart.config} className="mt-4 h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chart.rows} barCategoryGap="22%" maxBarSize={36}>
                <defs>
                  {chart.types.map((type) => (
                    <pattern
                      key={type.key}
                      id={`hatch-${type.key}`}
                      width="6"
                      height="6"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(45)"
                    >
                      <rect width="6" height="6" fill="var(--surface)" />
                      <line x1="0" y1="0" x2="0" y2="6" stroke={type.color} strokeWidth="2.5" />
                    </pattern>
                  ))}
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
                {chart.types.map((type) => (
                  <Bar
                    key={`${type.key}Past`}
                    dataKey={`${type.key}Past`}
                    stackId={type.key}
                    fill={type.color}
                    stroke="var(--surface)"
                    strokeWidth={1}
                  />
                ))}
                {chart.types.map((type) => (
                  <Bar
                    key={`${type.key}Future`}
                    dataKey={`${type.key}Future`}
                    stackId={type.key}
                    fill={`url(#hatch-${type.key})`}
                    stroke={type.color}
                    strokeWidth={1.5}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          {/* Legend: identity is never colour alone. */}
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted-foreground)]">
            {chart.types.map((type) => (
              <li key={type.key} className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="h-3 w-3 rounded-[3px]" style={{ background: type.color }} />
                <span className="text-[var(--foreground)]">{type.type}</span>
              </li>
            ))}
            <li className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-3 w-3 rounded-[3px] border-[1.5px] border-[var(--muted-foreground)] bg-[repeating-linear-gradient(45deg,var(--muted-foreground)_0_1.5px,transparent_1.5px_4px)]" />
              {labels.chartFutureNote}
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
