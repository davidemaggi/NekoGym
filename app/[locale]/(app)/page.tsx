import { getDictionary, isLocale } from "@/lib/i18n";
import { PwaInstallBanner } from "@/components/pwa/install-banner";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "it";
  const dictionary = getDictionary(safeLocale);
  const labels = dictionary.appPages.dashboard;

  return (
    <section className="space-y-6">
      <PwaInstallBanner labels={dictionary.pwaInstall} />
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">{labels.stats.activeCourses}</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">{labels.stats.todayLessons}</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">{labels.stats.bookings}</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
      </div>
    </section>
  );
}
