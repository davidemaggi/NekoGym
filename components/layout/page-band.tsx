import type { ReactNode } from "react";

type PageBandProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Primary page action, top-right of the band. */
  action?: ReactNode;
  /** Extra content inside the band (filters, tabs), below the header. */
  children?: ReactNode;
};

/** Page-owned section band: the stock runs full-bleed and ends on its own edge, replacing the shell band. */
export function PageBand({ title, description, action, children }: PageBandProps) {
  return (
    <div
      data-page-band
      className="-mt-4 bg-[var(--stock)] pb-5 pt-1 shadow-[0_0_0_100vmax_var(--stock)] [clip-path:inset(0_-100vmax)] lg:-mt-10 lg:pb-6 lg:pt-10"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.375rem] font-bold leading-tight lg:text-[2rem]">{title}</h1>
          {description ? <p className="mt-1 text-[15px] text-[var(--stock-ink)]/75">{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}
