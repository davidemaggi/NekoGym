import { requireAuth } from "@/lib/authorization";
import { createAppDateTimeFormatter, getAppDateTimeConfig, parseDateInputToUtc } from "@/lib/date-time";
import { getDictionary, isLocale } from "@/lib/i18n";
import { sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { prisma } from "@/lib/prisma";
import { PwaInstallBanner } from "@/components/pwa/install-banner";
import { DashboardPendingApprovals } from "@/app/[locale]/(app)/dashboard-pending-approvals";
import { DashboardUserInsights } from "@/app/[locale]/(app)/dashboard-user-insights";
import { DashboardCrowdingChart } from "@/app/[locale]/(app)/dashboard-crowding-chart";

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekdayInAppTimeZone(date: Date): number {
  const { timeZone } = getAppDateTimeConfig();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[parts] ?? date.getDay();
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ crowdingDay?: string }>;
}) {
  const { locale } = await params;
  const { crowdingDay } = await searchParams;
  const currentUser = await requireAuth(locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const dictionary = getDictionary(safeLocale);
  const labels = dictionary.appPages.dashboard;
  const lessonLabels = dictionary.lessonsPage;
  const bookingLabels = dictionary.bookings;
  const now = new Date();
  const iconOptions = await getLessonTypeIconOptions();
  const canManageLessons = currentUser.role === "ADMIN" || currentUser.role === "TRAINER";

  const trainerCandidates =
    currentUser.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "TRAINER"] } },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : currentUser.role === "TRAINER"
        ? [{ id: currentUser.id, name: currentUser.name, email: currentUser.email }]
        : [];

  const lessonTypeCandidates = canManageLessons
    ? await prisma.lessonType.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const attendeeCandidates = canManageLessons
    ? await prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      })
    : [];

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

  const todayKey = toDateKey(now);
  const selectedCrowdingDayKey =
    crowdingDay && /^\d{4}-\d{2}-\d{2}$/.test(crowdingDay) ? crowdingDay : todayKey;
  const selectedCrowdingDayStart =
    parseDateInputToUtc(selectedCrowdingDayKey) ??
    (() => {
      const fallback = new Date(now);
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    })();
  const selectedCrowdingDayEnd = new Date(selectedCrowdingDayStart.getTime() + 24 * 60 * 60 * 1000);
  const crowdingWindowStart = new Date(selectedCrowdingDayStart.getTime() - 84 * 24 * 60 * 60 * 1000);
  const targetWeekday = weekdayInAppTimeZone(selectedCrowdingDayStart);
  const prevCrowdingDate = new Date(selectedCrowdingDayStart);
  prevCrowdingDate.setDate(prevCrowdingDate.getDate() - 1);
  const nextCrowdingDate = new Date(selectedCrowdingDayStart);
  nextCrowdingDate.setDate(nextCrowdingDate.getDate() + 1);

  const crowdingLessons =
    currentUser.role === "ADMIN" || currentUser.role === "TRAINER"
      ? await prisma.lesson.findMany({
          where: {
            deletedAt: null,
            status: "SCHEDULED",
            startsAt: {
              gte: crowdingWindowStart,
              lt: selectedCrowdingDayEnd,
            },
            ...(currentUser.role === "TRAINER" ? { trainerId: currentUser.id } : {}),
          },
          select: {
            startsAt: true,
            bookings: {
              where: { status: "CONFIRMED" },
              select: { id: true },
            },
          },
          orderBy: { startsAt: "asc" },
        })
      : [];

  const crowdingByHour = new Map<number, { lessonsCount: number; totalBookings: number }>();
  const sampleDayKeys = new Set<string>();
  for (const lesson of crowdingLessons) {
    if (weekdayInAppTimeZone(lesson.startsAt) !== targetWeekday) continue;
    const hour = lesson.startsAt.getHours();
    const current = crowdingByHour.get(hour) ?? { lessonsCount: 0, totalBookings: 0 };
    current.lessonsCount += 1;
    current.totalBookings += lesson.bookings.length;
    crowdingByHour.set(hour, current);
    sampleDayKeys.add(toDateKey(lesson.startsAt));
  }
  const crowdingRows = Array.from(crowdingByHour.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, value]) => ({
      hourLabel: `${String(hour).padStart(2, "0")}:00`,
      avgAttendees: Math.round((value.totalBookings / Math.max(1, value.lessonsCount)) * 10) / 10,
      lessonsCount: value.lessonsCount,
    }));

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
      cancellationWindowHours: true,
      trainerId: true,
      trainer: { select: { id: true, name: true } },
      course: { select: { id: true, name: true } },
      lessonType: { select: { id: true, name: true, iconSvg: true, colorHex: true } },
      bookings: {
        select: {
          status: true,
          attendanceStatus: true,
          trainee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      waitlistEntries: {
        select: {
          trainee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
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
        <h2 className="text-2xl font-semibold tracking-tight">Ciao {currentUser.name}!</h2>
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
            canGrantOpenAccess={currentUser.role === "ADMIN"}
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

      {currentUser.role === "ADMIN" || currentUser.role === "TRAINER" ? (
        <DashboardCrowdingChart
          dayLabel={createAppDateTimeFormatter({
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })(selectedCrowdingDayStart)}
          contextLabel={labels.crowding.contextLabel.replace("{days}", String(sampleDayKeys.size))}
          prevHref={`/${locale}?crowdingDay=${toDateKey(prevCrowdingDate)}`}
          nextHref={`/${locale}?crowdingDay=${toDateKey(nextCrowdingDate)}`}
          rows={crowdingRows}
          labels={{
            title: labels.crowding.title,
            description: labels.crowding.description,
            previousDay: labels.crowding.previousDay,
            nextDay: labels.crowding.nextDay,
            empty: labels.crowding.empty,
            avgAttendees: labels.crowding.avgAttendees,
          }}
        />
      ) : null}

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
          maxAttendees: lesson.maxAttendees,
          cancellationWindowHours: lesson.cancellationWindowHours,
          queueLength: lesson._count.waitlistEntries,
          canViewWaitlist: true,
          isCourseLesson: Boolean(lesson.course?.id),
          lessonTypeName: lesson.lessonType?.name ?? "-",
          lessonTypeId: lesson.lessonType?.id ?? "",
          lessonTypeIcon: lesson.lessonType
            ? sanitizeLessonTypeIconPath(lesson.lessonType.iconSvg, iconOptions)
            : null,
          lessonTypeColor: lesson.lessonType ? sanitizeLessonTypeColor(lesson.lessonType.colorHex) : null,
          canBroadcast: currentUser.role === "ADMIN" || lesson.trainerId === currentUser.id,
          canManage: currentUser.role === "ADMIN" || lesson.trainerId === currentUser.id,
          canGrantOpenAccess: currentUser.role === "ADMIN",
          canManageTrainer: currentUser.role === "ADMIN",
          trainerIdForManage: lesson.trainer?.id ?? "",
          attendees: lesson.bookings
            .filter((booking) => booking.status === "CONFIRMED")
            .map((booking) => ({
              id: booking.trainee.id,
              name: booking.trainee.name,
              email: booking.trainee.email,
            })),
          attendeeAttendance: Object.fromEntries(
            lesson.bookings
              .filter((booking) => booking.status === "CONFIRMED")
              .map((booking) => [booking.trainee.id, booking.attendanceStatus ?? null])
          ),
          pendingApprovals: lesson.bookings
            .filter((booking) => booking.status === "PENDING")
            .map((booking) => ({
              id: booking.trainee.id,
              name: booking.trainee.name,
              email: booking.trainee.email,
            })),
          waitlist: lesson.waitlistEntries.map((entry) => ({
            id: entry.trainee.id,
            name: entry.trainee.name,
            email: entry.trainee.email,
          })),
          roleKind: lesson.trainerId === currentUser.id ? "TRAINER" : "TRAINEE",
          bookingStatus: lesson.bookings.find((booking) => booking.trainee.id === currentUser.id)?.status ?? null,
        }))}
        lessonManageData={{
          trainerCandidates,
          lessonTypeCandidates,
          attendeeCandidates,
        }}
        lessonDetailsLabels={{
          detailsTitle: lessonLabels.detailsTitle,
          detailsDescription: lessonLabels.detailsDescription,
          startsAtLabel: lessonLabels.startsAtLabel,
          endsAtLabel: bookingLabels.endsAtLabel,
          trainerLabel: lessonLabels.trainerLabel,
          bookedLabel: lessonLabels.bookedLabel,
          queuedLabel: bookingLabels.queuedLabel,
          closeCta: lessonLabels.closeCta,
          courseTag: lessonLabels.courseTag,
          lessonDescriptionLabel: lessonLabels.lessonDescriptionLabel,
          notifySectionTitle: lessonLabels.notifySectionTitle,
          notifyMessagePlaceholder: lessonLabels.notifyMessagePlaceholder,
          notifySendCta: lessonLabels.notifySendCta,
        }}
        lessonManageLabels={{
          title: lessonLabels.manageTitle,
          description: lessonLabels.manageDescription,
          tabMain: lessonLabels.manageTabMain,
          tabPeople: lessonLabels.manageTabPeople,
          startsAtLabel: lessonLabels.startsAtLabel,
          trainerLabel: lessonLabels.trainerLabel,
          standaloneDuration: lessonLabels.standaloneDuration,
          standaloneMaxAttendees: lessonLabels.standaloneMaxAttendees,
          standaloneCancellationWindow: lessonLabels.standaloneCancellationWindow,
          standaloneLessonType: lessonLabels.standaloneLessonType,
          lessonTitleLabel: lessonLabels.lessonTitleLabel,
          lessonDescriptionLabel: lessonLabels.lessonDescriptionLabel,
          updateStandaloneCta: lessonLabels.updateStandaloneCta,
          updateTrainerCta: lessonLabels.updateTrainerCta,
          attendeesLabel: lessonLabels.attendeesLabel,
          noAttendees: lessonLabels.noAttendees,
          attendeeSelectLabel: lessonLabels.attendeeSelectLabel,
          addAttendeeCta: lessonLabels.addAttendeeCta,
          removeAttendeeCta: lessonLabels.removeAttendeeCta,
          markAttendancePresentCta: lessonLabels.markAttendancePresentCta,
          markAttendanceNoShowCta: lessonLabels.markAttendanceNoShowCta,
          attendanceStatusLabel: lessonLabels.attendanceStatusLabel,
          attendanceStatusPresent: lessonLabels.attendanceStatusPresent,
          attendanceStatusNoShow: lessonLabels.attendanceStatusNoShow,
          attendanceStatusUnmarked: lessonLabels.attendanceStatusUnmarked,
          pendingApprovalsLabel: lessonLabels.pendingApprovalsLabel,
          noPendingApprovals: lessonLabels.noPendingApprovals,
          confirmPendingCta: lessonLabels.confirmPendingCta,
          confirmPendingAndGrantAccessCta: lessonLabels.confirmPendingAndGrantAccessCta,
          rejectPendingCta: lessonLabels.rejectPendingCta,
          waitlistLabel: lessonLabels.waitlistLabel,
          noWaitlist: lessonLabels.noWaitlist,
          confirmWaitlistCta: lessonLabels.confirmWaitlistCta,
          removeWaitlistCta: lessonLabels.removeWaitlistCta,
          processing: lessonLabels.processing,
          closeCta: lessonLabels.closeCta,
          manageTriggerLabel: lessonLabels.manageTriggerLabel,
          notifySectionTitle: lessonLabels.notifySectionTitle,
          notifyMessageLabel: lessonLabels.notifyMessageLabel,
          notifyMessagePlaceholder: lessonLabels.notifyMessagePlaceholder,
          notifySendCta: lessonLabels.notifySendCta,
        }}
        labels={labels.userInsights}
      />
    </section>
  );
}
