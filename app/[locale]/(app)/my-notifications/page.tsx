import { requireAuth } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

import { MyNotificationsManager } from "@/app/[locale]/(app)/my-notifications/my-notifications-manager";

export default async function MyNotificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page } = await searchParams;
  const user = await requireAuth(locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).appPages.myNotifications;

  const now = new Date();
  const previousSeen = await prisma.user.findUnique({
    where: { id: user.id },
    select: { notificationsLastSeenAt: true },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { notificationsLastSeenAt: now },
  });

  const parsedPage = Number.parseInt(page ?? "1", 10);
  const currentPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const pageSize = 20;
  const total = await prisma.localNotification.count({
    where: { userId: user.id },
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const items = await prisma.localNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  });

  return (
    <MyNotificationsManager
      locale={locale}
      labels={labels}
      items={items.map((item) => ({
        id: item.id,
        subject: item.subject,
        body: item.body,
        createdAt: item.createdAt.toISOString(),
        isNew: previousSeen?.notificationsLastSeenAt ? item.createdAt > previousSeen.notificationsLastSeenAt : true,
      }))}
      page={safePage}
      totalPages={totalPages}
    />
  );
}
