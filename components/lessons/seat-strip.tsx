import { cn } from "@/lib/utils";

/**
 * Seat strip: one segment per seat up to 16, a continuous bar beyond. Confirmed seats are solid ink;
 * seats held by pending requests are dashed (Perforation rule: dashed means provisional).
 */
export function SeatStrip({
  booked,
  pending,
  max,
  label,
  muted = false,
}: {
  booked: number;
  pending: number;
  max: number;
  label: string;
  /** Cancelled lessons: the strip steps back to secondary ink. */
  muted?: boolean;
}) {
  const solid = max > 0 ? Math.min(1, booked / max) : 0;
  const held = max > 0 ? Math.min(1 - solid, pending / max) : 0;
  return (
    <div title={label} className={muted ? "opacity-50" : undefined}>
      <p className="tabular text-sm text-[var(--muted-foreground)]">
        <span className="text-[17px] font-bold text-[var(--foreground)]">{booked}</span>/{max}
        {pending > 0 ? <span> +{pending}</span> : null}
        <span className="sr-only"> · {label}</span>
      </p>
      {max <= 16 ? (
        <div aria-hidden="true" className="mt-1.5 flex gap-0.5">
          {Array.from({ length: max }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-[7px] flex-1 rounded-[2px]",
                index < booked
                  ? "bg-[var(--foreground)]"
                  : index < booked + pending
                    ? "border border-dashed border-[var(--foreground)]"
                    : "bg-[var(--surface-border)]"
              )}
            />
          ))}
        </div>
      ) : (
        <div aria-hidden="true" className="mt-1.5 flex h-[7px] overflow-hidden rounded-full bg-[var(--surface-border)]">
          <div className="h-full bg-[var(--foreground)]" style={{ width: `${solid * 100}%` }} />
          <div className="h-full border border-dashed border-[var(--foreground)]" style={{ width: `${held * 100}%` }} />
        </div>
      )}
    </div>
  );
}
