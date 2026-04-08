import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAnyRole(["ADMIN"], locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).appPages.reports;

  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{labels.description}</p>
    </section>
  );
}

