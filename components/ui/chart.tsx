"use client";

import * as React from "react";
import {
  Tooltip as RechartsTooltip,
  type TooltipContentProps,
  type TooltipPayloadEntry,
} from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

type ChartContextType = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextType | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used inside <ChartContainer />");
  }
  return context;
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
};

export function ChartContainer({ id, className, children, config, style, ...props }: ChartContainerProps) {
  const chartId = React.useId().replace(/:/g, "");
  const resolvedId = id ?? `chart-${chartId}`;

  const chartVars: Record<`--color-${string}`, string> = {};
  for (const [key, value] of Object.entries(config)) {
    chartVars[`--color-${key}`] = value.color;
  }

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        id={resolvedId}
        data-chart={resolvedId}
        className={cn(
          "flex aspect-video w-full items-center justify-center text-[13px]",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-[var(--surface-border)]",
          "[&_.recharts-text]:fill-[var(--muted-foreground)]",
          className
        )}
        style={{ ...(chartVars as React.CSSProperties), ...style }}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsTooltip;

type ChartTooltipContentProps = Partial<TooltipContentProps> & {
  hideLabel?: boolean;
};

export function ChartTooltipContent({ active, payload, label, hideLabel = false }: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="min-w-44 rounded-xl border border-[var(--rule)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--muted-foreground)] shadow-[var(--shadow-sheet)]">
      {!hideLabel ? <p className="mb-1.5 font-semibold text-[var(--foreground)]">{String(label ?? "")}</p> : null}
      <div className="space-y-1">
        {payload.map((item: TooltipPayloadEntry) => {
          const key = String(item.dataKey ?? "");
          const conf = config[key];
          if (!conf) return null;
          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: conf.color }} />
                <span>{conf.label}</span>
              </span>
              <span className="tabular font-semibold text-[var(--foreground)]">{Number(item.value ?? 0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
