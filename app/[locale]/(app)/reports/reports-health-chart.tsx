"use client";

import { Bar, BarChart, CartesianGrid, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

type HealthRow = {
  courseName: string;
  fillRatePct: number;
  noShowRatePct: number;
};

type ReportsHealthChartProps = {
  rows: HealthRow[];
  labels: {
    title: string;
    description: string;
    empty: string;
    fillRate: string;
    noShowRate: string;
  };
};

const config: ChartConfig = {
  fillRatePct: { label: "fill", color: "#d89a73" },
  noShowRatePct: { label: "no-show", color: "#b74b4b" },
};

export function ReportsHealthChart({ rows, labels }: ReportsHealthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">{labels.empty}</p>
        ) : (
          <ChartContainer config={config} className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="courseName" tickLine={false} axisLine={false} interval={0} angle={-18} textAnchor="end" height={70} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="fillRatePct" fill="var(--color-fillRatePct)" radius={4} />
                <Line type="monotone" dataKey="noShowRatePct" stroke="var(--color-noShowRatePct)" strokeWidth={2} dot />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
