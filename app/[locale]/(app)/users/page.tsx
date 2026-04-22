import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

import { UsersManager } from "@/app/[locale]/(app)/users/users-manager";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentUser = await requireAnyRole(["ADMIN"], locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const labels = getDictionary(safeLocale).usersPage;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerifiedAt: true,
      isDisabled: true,
      role: true,
      membershipStatus: true,
      trialEndsAt: true,
      subscriptionType: true,
      subscriptionLessons: true,
      subscriptionRemaining: true,
      subscriptionResetAt: true,
      subscriptionEndsAt: true,
      lessonTypeAccesses: {
        select: {
          lessonTypeId: true,
          mode: true,
        },
      },
    },
  });
  const lessonTypes = await prisma.lessonType.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <UsersManager
      locale={locale}
      currentUserId={currentUser.id}
      labels={labels}
      lessonTypes={lessonTypes}
      users={users.map((user) => ({
        ...user,
        emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
        trialEndsAt: user.trialEndsAt ? user.trialEndsAt.toISOString() : null,
        subscriptionResetAt: user.subscriptionResetAt ? user.subscriptionResetAt.toISOString() : null,
        subscriptionEndsAt: user.subscriptionEndsAt ? user.subscriptionEndsAt.toISOString() : null,
        lessonTypeAccesses: user.lessonTypeAccesses,
      }))}
    />
  );
}
