import { DangerZoneManager } from "@/app/[locale]/(app)/settings/danger-zone/danger-zone-manager";
import { requireAnyRole } from "@/lib/authorization";
import { listBackups } from "@/lib/danger-zone";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function DangerZonePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAnyRole(["ADMIN"], locale);

  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).dangerZone;
  const backups = (await listBackups()).map((backup) => ({
    fileName: backup.fileName,
    createdAtIso: backup.createdAt.toISOString(),
    sizeBytes: backup.sizeBytes,
  }));

  return <DangerZoneManager locale={locale} labels={labels} backups={backups} />;
}
