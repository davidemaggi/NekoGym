import { readFile } from "node:fs/promises";

import { requireAnyRole } from "@/lib/authorization";
import { listBackups } from "@/lib/danger-zone";
import { isLocale } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> }
) {
  const { locale } = await context.params;
  const safeLocale = isLocale(locale) ? locale : "it";
  await requireAnyRole(["ADMIN"], safeLocale);

  const url = new URL(request.url);
  const backupFileName = (url.searchParams.get("file") ?? "").trim();
  if (!backupFileName) {
    return new Response("Missing backup file name", { status: 400 });
  }

  const backups = await listBackups();
  const target = backups.find((backup) => backup.fileName === backupFileName);
  if (!target) {
    return new Response("Backup not found", { status: 404 });
  }

  const bytes = await readFile(target.fullPath);

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/x-sqlite3",
      "Content-Disposition": `attachment; filename="${target.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
