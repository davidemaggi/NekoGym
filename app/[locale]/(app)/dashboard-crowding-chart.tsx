"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const config: ChartConfig = {
  avgAttendees: {
    label: "avg",
    color: "#d89a73",
  },
};

export function DashboardCrowdingChart({
  dayLabel,
  contextLabel,
  prevHref,
  nextHref,
  rows,
  labels,
}: DashboardCrowdingChartProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>{labels.title}</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{contextLabel}</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm">
            <a className="text-[var(--foreground)] hover:underline" href={prevHref}>
              {labels.previousDay}
            </a>
            <span className="rounded-md bg-[var(--muted)] px-2 py-1 text-xs">{dayLabel}</span>
            <a className="text-[var(--foreground)] hover:underline" href={nextHref}>
              {labels.nextDay}
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">{labels.empty}</p>
        ) : (
          <ChartContainer config={config} className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="hourLabel" tickLine={false} axisLine={false} minTickGap={10} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="avgAttendees" fill="var(--color-avgAttendees)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
