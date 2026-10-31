"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

type CrowdingRow = {
  hourLabel: string;
  avgAttendees: number;
  lessonsCount: number;
};

type DashboardCrowdingChartProps = {
  dayLabel: string;
  contextLabel: string;
  prevHref: string;
  nextHref: string;
  rows: CrowdingRow[];
  labels: {
    title: string;
    description: string;
    previousDay: string;
    nextDay: string;
    empty: string;
    avgAttendees: string;
  };
};

/** Average attendees per hour slot on one weekday (single series: no legend, the title names it). */
export function DashboardCrowdingChart({ dayLabel, contextLabel, prevHref, nextHref, rows, labels }: DashboardCrowdingChartProps) {
  const config: ChartConfig = {
    avgAttendees: { label: labels.avgAttendees, color: "var(--chart-1)" },
  };

  return (
    <section aria-labelledby="crowding-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="crowding-heading" className="text-[17px] font-semibold">{labels.title}</h2>
          <p className="mt-0.5 text-[15px] text-[var(--muted-foreground)]">{labels.description}</p>
        </div>
        <div className="inline-flex items-center gap-1">
          <Link
            href={prevHref}
            scroll={false}
            aria-label={labels.previousDay}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
          <span className="min-w-[10rem] text-center text-[15px] font-semibold first-letter:uppercase">{dayLabel}</span>
          <Link
            href={nextHref}
            scroll={false}
            aria-label={labels.nextDay}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-[15px] text-[var(--muted-foreground)]">{labels.empty}</p>
      ) : (
        <>
          <ChartContainer config={config} className="mt-4 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={rows} barCategoryGap="28%">
                <CartesianGrid vertical={false} />
                <XAxis dataKey="hourLabel" tickLine={false} axisLine={false} minTickGap={10} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
                <Bar dataKey="avgAttendees" fill="var(--color-avgAttendees)" radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{contextLabel}</p>
        </>
      )}
    </section>
  );
}
