import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { computePlanUsages } from "@/lib/plan-usage";
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
      subscriptionEndsAt: true,
      medicalCertificateSubmittedAt: true,
      medicalCertificateExpiresAt: true,
      lessonTypeAccesses: {
        select: {
          lessonTypeId: true,
          mode: true,
        },
      },
    },
  });
  // Plan spent in the current week/month (or of the pack), counted like booking eligibility does.
  const now = new Date();
  const planUsage = await computePlanUsages(
    prisma,
    users.filter((user) => user.role === "TRAINEE").map((user) => ({ key: user.id, traineeId: user.id, at: now }))
  );
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
        subscriptionEndsAt: user.subscriptionEndsAt ? user.subscriptionEndsAt.toISOString() : null,
        medicalCertificateSubmittedAt: user.medicalCertificateSubmittedAt?.toISOString() ?? null,
        medicalCertificateExpiresAt: user.medicalCertificateExpiresAt?.toISOString() ?? null,
        lessonTypeAccesses: user.lessonTypeAccesses,
        planUsage: planUsage.get(user.id) ?? null,
      }))}
    />
  );
}
