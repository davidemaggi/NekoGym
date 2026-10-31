import type { ReactNode } from "react";
import { AlertCircle, Ticket } from "lucide-react";

import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type BookingPass =
  | { kind: "fixed" | "weekly" | "monthly"; total: number; used: number; remaining: number; validUntilLabel: string | null; activeBookings: number }
  | { kind: "open"; validUntilLabel: string | null; activeBookings: number }
  | { kind: "trial"; untilLabel: string; activeBookings: number }
  | { kind: "inactive"; activeBookings: number };

type PassLabels = Dictionary["bookings"]["pass"];

export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** Like fill(), but sets {date} in condensed tabular figures, as printed on a ticket. */
function fillDate(template: string, date: string): ReactNode {
  const [before, after = ""] = template.split("{date}");
  return (
    <>
      {before}
      <span className="tabular">{date}</span>
      {after}
    </>
  );
}

/** The member's season pass: plan, remaining entries as validator slots, expiry. */
export function PassCard({ pass, labels }: { pass: BookingPass; labels: PassLabels }) {
  const activeLine =
    pass.activeBookings === 1 ? labels.activeBookingsOne : fill(labels.activeBookings, { n: pass.activeBookings });

  let title: string;
  let figure: ReactNode = null;
  let body: ReactNode = null;
  let footer: ReactNode[] = [];
  let tone: "default" | "warning" = "default";

  if (pass.kind === "fixed" || pass.kind === "weekly" || pass.kind === "monthly") {
    title = fill(
      pass.kind === "fixed" ? labels.fixedTitle : pass.kind === "weekly" ? labels.weeklyTitle : labels.monthlyTitle,
      { n: pass.total }
    );
    const caption = pass.kind === "fixed" ? labels.remaining : pass.kind === "weekly" ? labels.availableWeek : labels.availableMonth;
    figure = (
      <p className="text-right leading-none">
        <span className="tabular text-[2.5rem] font-bold">{pass.remaining}</span>
        <span className="mt-1 block text-[13px] font-semibold text-[var(--muted-foreground)]">{caption}</span>
      </p>
    );
    // One validator slot per entry; long plans fall back to the counter alone.
    if (pass.total > 0 && pass.total <= 20) {
      body = (
        <div>
          <ol
            aria-label={fill(labels.slotsLabel, { used: pass.used, total: pass.total })}
            className="grid max-w-[26rem] gap-1.5"
            style={{ gridTemplateColumns: `repeat(${Math.min(pass.total, 10)}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: pass.total }, (_, index) => {
              const used = index < pass.used;
              return (
                <li
                  key={index}
                  aria-hidden="true"
                  className={cn(
                    "aspect-square max-h-7 rounded-full border-[1.5px]",
                    used ? "border-[var(--stamp)] bg-[radial-gradient(circle,var(--stamp)_0_38%,transparent_40%)]" : "border-[var(--surface-border)]"
                  )}
                />
              );
            })}
          </ol>
        </div>
      );
    }
    footer = [pass.validUntilLabel ? fillDate(labels.validUntil, pass.validUntilLabel) : null, activeLine].filter(Boolean);
  } else if (pass.kind === "open") {
    title = labels.openPlanTitle;
    body = <p className="text-[15px] text-[var(--muted-foreground)]">{labels.openPlanBody}</p>;
    footer = [pass.validUntilLabel ? fillDate(labels.validUntil, pass.validUntilLabel) : null, activeLine].filter(Boolean);
  } else if (pass.kind === "trial") {
    title = labels.trialTitle;
    body = <p className="text-[15px] text-[var(--muted-foreground)]">{fillDate(labels.trialUntil, pass.untilLabel)}</p>;
    footer = [activeLine];
  } else {
    title = labels.inactiveTitle;
    tone = "warning";
    body = <p className="text-[15px]">{labels.inactiveBody}</p>;
    footer = pass.activeBookings > 0 ? [activeLine] : [];
  }

  return (
    <section
      aria-label={title}
      className={cn(
        "relative overflow-hidden rounded-2xl shadow-[var(--shadow-lift)]",
        tone === "warning" ? "bg-[var(--warning-bg)] text-[var(--warning-fg)]" : "bg-[var(--surface)]"
      )}
    >
      <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
        <div className="flex min-w-0 items-start gap-2.5">
          {tone === "warning" ? (
            <AlertCircle size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
          ) : (
            <Ticket size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--muted-foreground)]" />
          )}
          <h2 className="text-[17px] font-semibold leading-snug">{title}</h2>
        </div>
        {figure}
      </div>
      {body || footer.length > 0 ? (
        <div className="border-t-2 border-dashed border-[var(--rule)] px-5 pb-5 pt-4">
          {body}
          {footer.length > 0 ? (
            <p className={cn("text-sm", body ? "mt-3" : "", tone === "warning" ? "" : "text-[var(--muted-foreground)]")}>
              {footer.map((part, index) => (
                <span key={index}>
                  {index > 0 ? " · " : null}
                  {part}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
