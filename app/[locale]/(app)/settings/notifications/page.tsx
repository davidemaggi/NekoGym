import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

import { NotificationsManager } from "@/app/[locale]/(app)/settings/notifications/notifications-manager";

export default async function NotificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; channel?: string; page?: string; from?: string; to?: string }>;
}) {
  const { locale } = await params;
  const { status, channel, page, from, to } = await searchParams;
  await requireAnyRole(["ADMIN"], locale);

  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).manualNotifications;

  const statusValues = ["ALL", "PENDING", "PROCESSING", "SENT", "FAILED"] as const;
  const channelValues = ["ALL", "EMAIL", "TELEGRAM", "WEBPUSH"] as const;
  type StatusFilter = (typeof statusValues)[number];
  type ChannelFilter = (typeof channelValues)[number];

  const selectedStatus = statusValues.includes((status ?? "").toUpperCase() as StatusFilter)
    ? ((status ?? "").toUpperCase() as StatusFilter)
    : "FAILED";
  const selectedChannel = channelValues.includes((channel ?? "").toUpperCase() as ChannelFilter)
    ? ((channel ?? "").toUpperCase() as ChannelFilter)
    : "ALL";

  const parsedPage = Number.parseInt(page ?? "1", 10);
  const currentPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const pageSize = 30;

  const createdAtFilter: { gte?: Date; lte?: Date } = {};
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    createdAtFilter.gte = new Date(`${from}T00:00:00`);
  }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    createdAtFilter.lte = new Date(`${to}T23:59:59`);
  }

  const where = {
    ...(selectedStatus === "ALL" ? {} : { status: selectedStatus }),
    ...(selectedChannel === "ALL" ? {} : { channel: selectedChannel }),
    ...(createdAtFilter.gte || createdAtFilter.lte ? { createdAt: createdAtFilter } : {}),
  };

  const total = await prisma.notificationOutbox.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const outboxFailed = await prisma.notificationOutbox.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  });

  return (
    <NotificationsManager
      locale={locale}
      labels={labels}
      outboxFailed={outboxFailed}
      filters={{
        status: selectedStatus,
        channel: selectedChannel,
        from: from ?? "",
        to: to ?? "",
        page: safePage,
        totalPages,
        total,
      }}
    />
  );
}

