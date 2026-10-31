import type { PlanUsage } from "@/lib/plan-usage";
import { cn } from "@/lib/utils";

const PERIOD = {
  it: { WEEKLY: "sett.", MONTHLY: "mese", FIXED: "pacchetto" },
  en: { WEEKLY: "week", MONTHLY: "month", FIXED: "pack" },
} as const;
const USED = { it: "usate", en: "used" } as const;

const SPOKEN = {
  it: {
    WEEKLY: (used: number, limit: number) => `${used} lezioni su ${limit} nella settimana`,
    MONTHLY: (used: number, limit: number) => `${used} lezioni su ${limit} nel mese`,
    FIXED: (used: number, limit: number) => `${used} lezioni usate su ${limit} del pacchetto`,
  },
  en: {
    WEEKLY: (used: number, limit: number) => `${used} of ${limit} lessons this week`,
    MONTHLY: (used: number, limit: number) => `${used} of ${limit} lessons this month`,
    FIXED: (used: number, limit: number) => `${used} of ${limit} pack lessons used`,
  },
} as const;

/**
 * "2/3 sett.": lessons used against the plan in the period. At the limit it turns into a
 * warning chip that also says "esaurito", so it never relies on colour alone.
 */
export function PlanUsageTag({
  usage,
  locale,
  className,
  hidePeriod = false,
}: {
  usage: PlanUsage;
  locale: string;
  className?: string;
  /** When the plan name is printed next to it (e.g. "Pacchetto"), skip repeating the period. */
  hidePeriod?: boolean;
}) {
  const lang = locale === "it" ? "it" : "en";
  const full = usage.used >= usage.limit;
  return (
    <span
      title={SPOKEN[lang][usage.kind](usage.used, usage.limit)}
      className={cn(
        "inline-flex shrink-0 items-baseline gap-1 rounded-lg px-2 py-0.5 text-[13px] font-semibold",
        full ? "bg-[var(--warning-bg)] text-[var(--warning-fg)]" : "bg-[var(--muted)] text-[var(--foreground)]",
        className
      )}
    >
      <span className="sr-only">
        {SPOKEN[lang][usage.kind](usage.used, usage.limit)}
        {full ? (lang === "it" ? ", esaurito" : ", used up") : ""}
      </span>
      <span aria-hidden="true" className="tabular">
        {usage.used}/{usage.limit}
      </span>
      {/* "3/12 usate · mese": the figure always says it counts what is spent, never what is left. */}
      <span aria-hidden="true">
        {USED[lang]}
        {hidePeriod ? null : ` · ${PERIOD[lang][usage.kind]}`}
        {full ? (lang === "it" ? " · esaurito" : " · used up") : null}
      </span>
    </span>
  );
}
