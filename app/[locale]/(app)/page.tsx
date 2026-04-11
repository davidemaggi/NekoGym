import { requireAuth } from "@/lib/authorization";
import { createAppDateTimeFormatter } from "@/lib/date-time";
import { getDictionary, isLocale } from "@/lib/i18n";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { prisma } from "@/lib/prisma";
import { PwaInstallBanner } from "@/components/pwa/install-banner";
import { DashboardPendingApprovals } from "@/app/[locale]/(app)/dashboard-pending-approvals";
import { DashboardUserInsights } from "@/app/[locale]/(app)/dashboard-user-insights";

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
  const lessonLabels = dictionary.appPages.lessons;
  const now = new Date();
  const iconOptions = await getLessonTypeIconOptions();

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

  const personalLessons = await prisma.lesson.findMany({
    where: {
      deletedAt: null,
      status: "SCHEDULED",
      OR: [
        { trainerId: currentUser.id },
        {
          bookings: {
            some: {
              traineeId: currentUser.id,
              status: { in: ["CONFIRMED", "PENDING"] },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      maxAttendees: true,
      trainerId: true,
      trainer: { select: { name: true } },
      course: { select: { id: true, name: true } },
      lessonType: { select: { name: true, iconSvg: true, colorHex: true } },
      bookings: {
        where: { traineeId: currentUser.id },
        select: { status: true },
        take: 1,
      },
      _count: { select: { bookings: true, waitlistEntries: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const activeCoursesCount = await prisma.course.count({ where: { deletedAt: null } });
  const todayLessonsCount = personalLessons.filter((lesson) => {
    const date = lesson.startsAt;
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }).length;
  const futureBookingsCount = personalLessons.filter((lesson) => lesson.startsAt > now).length;

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
          <p className="mt-2 text-2xl font-semibold">{activeCoursesCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">{labels.stats.todayLessons}</p>
          <p className="mt-2 text-2xl font-semibold">{todayLessonsCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--muted-foreground)]">{labels.stats.bookings}</p>
          <p className="mt-2 text-2xl font-semibold">{futureBookingsCount}</p>
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

      <DashboardUserInsights
        locale={locale}
        lessons={personalLessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title?.trim() || lesson.course?.name || "-",
          description: lesson.description ?? null,
          startsAt: lesson.startsAt.toISOString(),
          endsAt: lesson.endsAt.toISOString(),
          trainerName: lesson.trainer?.name ?? null,
          occupancy: `${lesson._count.bookings}/${lesson.maxAttendees}`,
          queueLength: lesson._count.waitlistEntries,
          canViewWaitlist: true,
          isCourseLesson: Boolean(lesson.course?.id),
          lessonTypeName: lesson.lessonType?.name ?? "-",
          lessonTypeIcon: lesson.lessonType
            ? sanitizeLessonTypeIconPath(lesson.lessonType.iconSvg, iconOptions)
            : null,
          lessonTypeColor: lesson.lessonType ? sanitizeLessonTypeColor(lesson.lessonType.colorHex) : null,
          canBroadcast: currentUser.role === "ADMIN" || lesson.trainerId === currentUser.id,
          roleKind: lesson.trainerId === currentUser.id ? "TRAINER" : "TRAINEE",
          bookingStatus: lesson.bookings[0]?.status ?? null,
        }))}
        lessonDetailsLabels={{
          detailsTitle: lessonLabels.detailsTitle,
          detailsDescription: lessonLabels.detailsDescription,
          startsAtLabel: lessonLabels.startsAtLabel,
          endsAtLabel: lessonLabels.endsAtLabel,
          trainerLabel: lessonLabels.trainerLabel,
          bookedLabel: lessonLabels.bookedLabel,
          queuedLabel: lessonLabels.queuedLabel,
          closeCta: lessonLabels.closeCta,
          courseTag: lessonLabels.courseTag,
          lessonDescriptionLabel: lessonLabels.lessonDescriptionLabel,
          notifySectionTitle: lessonLabels.notifySectionTitle,
          notifyMessagePlaceholder: lessonLabels.notifyMessagePlaceholder,
          notifySendCta: lessonLabels.notifySendCta,
        }}
        labels={labels.userInsights}
      />
    </section>
  );
}
