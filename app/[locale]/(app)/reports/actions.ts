"use server";

import { redirect } from "next/navigation";

import { requireAnyRole } from "@/lib/authorization";
import { isLocale, withLocalePath } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { REPORT_IDS, selectedReportIdsToCsv, type ReportId } from "@/lib/reports";

function parseFrequency(input: string): "NEVER" | "WEEKLY" | "MONTHLY" {
  if (input === "WEEKLY" || input === "MONTHLY") return input;
  return "NEVER";
}

function parseSelectedReports(values: FormDataEntryValue[]): ReportId[] {
  const allowed = new Set<ReportId>(REPORT_IDS);
  const picked = values
    .map((value) => (typeof value === "string" ? value.trim().toUpperCase() : ""))
    .filter((value): value is ReportId => allowed.has(value as ReportId));
  return picked.length > 0 ? Array.from(new Set(picked)) : [...REPORT_IDS];
}

function parseDaysForRedirect(input: string): string {
  if (input === "7" || input === "30" || input === "90") return input;
  return "30";
}

export async function updateReportDeliverySettingsAction(formData: FormData) {
  const localeRaw = typeof formData.get("locale") === "string" ? String(formData.get("locale")) : "it";
  const locale = isLocale(localeRaw) ? localeRaw : "it";
  const user = await requireAnyRole(["ADMIN"], locale);
  const frequency = parseFrequency(typeof formData.get("reportDigestFrequency") === "string" ? String(formData.get("reportDigestFrequency")) : "");
  const selectedReports = parseSelectedReports(formData.getAll("reportIds"));
  const reportDigestReportsCsv = selectedReportIdsToCsv(selectedReports);
  const days = parseDaysForRedirect(typeof formData.get("days") === "string" ? String(formData.get("days")) : "");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      reportDigestFrequency: frequency,
      reportDigestReportsCsv,
      reportDigestLastSentAt: frequency === "NEVER" ? null : undefined,
    },
  });

  redirect(withLocalePath(locale, `/reports?days=${days}&saved=1`));
}
