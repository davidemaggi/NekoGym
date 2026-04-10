import { requireAuth } from "@/lib/authorization";
import { createAppDateTimeFormatter } from "@/lib/date-time";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { PwaInstallBanner } from "@/components/pwa/install-banner";
import { DashboardPendingApprovals } from "@/app/[locale]/(app)/dashboard-pending-approvals";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentUser = await requireAuth(locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const dictionary = getDictionary(safeLocale);
  const labels = dictionary.appPages.dashboard;
  const now = new Date();

  const pendingWhere = currentUser.role === "ADMIN"
    ? {
        status: "PENDING" as const,
        lesson: {
          status: "SCHEDULED" as const,
          deletedAt: null,
          startsAt: { gt: now },
        },
      }
    : currentUser.role === "TRAINER"
      ? {
          status: "PENDING" as const,
          lesson: {
            status: "SCHEDULED" as const,
            deletedAt: null,
            startsAt: { gt: now },
            trainerId: currentUser.id,
          },
        }
      : null;

  const pendingApprovals = pendingWhere
    ? await prisma.lessonBooking.findMany({
        where: pendingWhere,
        select: {
          lessonId: true,
          traineeId: true,
          trainee: { select: { name: true } },
          lesson: {
            select: {
              title: true,
              startsAt: true,
              course: { select: { name: true } },
              lessonType: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const dateFmt = createAppDateTimeFormatter({
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="space-y-6">
      <PwaInstallBanner labels={dictionary.pwaInstall} />
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
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
        {currentUser.role === "ADMIN" || currentUser.role === "TRAINER" ? (
          <DashboardPendingApprovals
            locale={locale}
            count={pendingApprovals.length}
            items={pendingApprovals.map((entry) => ({
              lessonId: entry.lessonId,
              traineeId: entry.traineeId,
              traineeName: entry.trainee.name,
              lessonTitle: entry.lesson.title?.trim() || entry.lesson.course?.name || "-",
              lessonTypeName: entry.lesson.lessonType?.name ?? "-",
              startsAtLabel: dateFmt(entry.lesson.startsAt),
            }))}
            labels={{
              statLabel: labels.stats.pendingApprovals,
              openCta: labels.pending.openCta,
              dialogTitle: labels.pending.dialogTitle,
              dialogDescription: labels.pending.dialogDescription,
              empty: labels.pending.empty,
              approveCta: labels.pending.approveCta,
              approveAndUnlockCta: labels.pending.approveAndUnlockCta,
              rejectCta: labels.pending.rejectCta,
              closeCta: labels.pending.closeCta,
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
