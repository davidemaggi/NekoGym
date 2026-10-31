import type { ReactNode } from "react";

/**
 * A full-page status message (404, error) as a single ticket on the lilla stock, like sign-in:
 * the figure is set as a ticket number, the message speaks plainly, one way forward.
 */
export function StatusScreen({
  figure,
  title,
  body,
  children,
}: {
  figure?: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div data-stock="lilla" className="relative min-h-dvh bg-[var(--paper)] px-4 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-64 bg-[var(--stock)] sm:h-80" />
      <main className="relative mx-auto w-full max-w-md rounded-3xl border border-[var(--rule)] bg-[var(--surface)] px-5 py-8 text-center shadow-[var(--shadow-lift)] sm:px-8 sm:py-10">
        <StatusBody figure={figure} title={title} body={body}>
          {children}
        </StatusBody>
      </main>
    </div>
  );
}

/** The message itself, also used inside the app shell (where the band is page-owned). */
export function StatusBody({ figure, title, body, children }: { figure?: string; title: string; body: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {figure ? (
        <p aria-hidden="true" className="tabular text-[3.5rem] font-bold leading-none text-[var(--stock-ink)]">
          {figure}
        </p>
      ) : null}
      <h1 className="text-[1.375rem] font-bold leading-tight">{title}</h1>
      <p className="max-w-prose text-[16px] text-[var(--muted-foreground)]">{body}</p>
      {children ? <div className="mt-3 flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center">{children}</div> : null}
    </div>
  );
}

export const statusPrimaryLinkClass =
  "inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-[16px] font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)] sm:w-auto";
export const statusSecondaryClass =
  "inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-[16px] font-semibold transition-colors hover:bg-[var(--muted)] sm:w-auto";
