/** Auth pages: a single ticket on the lilla stock, the band ending behind its top half. */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-stock="lilla" className="relative min-h-dvh bg-[var(--paper)] px-4 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-64 bg-[var(--stock)] sm:h-80" />
      <main className="relative mx-auto w-full max-w-md rounded-3xl border border-[var(--rule)] bg-[var(--surface)] px-5 py-7 shadow-[var(--shadow-lift)] sm:px-8 sm:py-9">
        {children}
      </main>
    </div>
  );
}
