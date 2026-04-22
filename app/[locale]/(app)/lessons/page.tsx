import type { CSSProperties } from "react";

import { requireAnyRole } from "@/lib/authorization";
import { getDictionary, isLocale } from "@/lib/i18n";
import { hexToRgba, sanitizeLessonTypeColor, sanitizeLessonTypeIconPath } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, RotateCcw, Trash2, Users } from "lucide-react";

import {
  deleteStandaloneLessonAction,
  restoreLessonAction,
} from "@/app/[locale]/(app)/lessons/actions";
import { BookingBadgeToggle } from "@/components/bookings/booking-badge-toggle";
import { LessonDetailsDialogTrigger } from "@/components/lessons/lesson-details-dialog-trigger";
import { LessonsFlashToast } from "@/app/[locale]/(app)/lessons/lessons-flash-toast";
import { StandaloneLessonCreateDialog } from "@/app/[locale]/(app)/lessons/standalone-lesson-create-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";

function parseMonthInput(value: string | undefined): { year: number; month: number } {
  if (!value) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  const year = Number.parseInt(match[1] ?? "", 10);
  const monthIndex = Number.parseInt(match[2] ?? "", 10) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  return { year, month: monthIndex };
}

function monthValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function lessonDifferenceReasons(input: {
  isCustomized: boolean;
  startsAt: Date;
  endsAt: Date;
  sourceStartTime: string | null;
  trainerId: string | null;
  course: { id: string; trainerId: string | null; durationMinutes: number } | null;
}): Array<"trainer" | "time"> {
  if (!input.course?.id) return [];

  const reasons = new Set<"trainer" | "time">();
  if (input.isCustomized) {
    reasons.add("trainer");
    reasons.add("time");
  }

  if (input.trainerId !== input.course.trainerId) {
    reasons.add("trainer");
  }

  const actualDuration = Math.round((input.endsAt.getTime() - input.startsAt.getTime()) / 60000);
  if (actualDuration !== input.course.durationMinutes) {
    reasons.add("time");
  }

  const hh = String(input.startsAt.getHours()).padStart(2, "0");
  const mm = String(input.startsAt.getMinutes()).padStart(2, "0");
  const localStartTime = `${hh}:${mm}`;
  if (input.sourceStartTime && input.sourceStartTime !== localStartTime) {
    reasons.add("time");
  }

  return Array.from(reasons);
}

export default async function LessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; flash?: string; flashType?: "success" | "error"; showDeleted?: string; showPast?: string }>;
}) {
  const { locale } = await params;
  const { month, flash, flashType, showDeleted, showPast } = await searchParams;
  const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
  const safeLocale = isLocale(locale) ? locale : "it";
  const dictionary = getDictionary(safeLocale);
  const labels = dictionary.lessonsPage;
  const bookingLabels = dictionary.bookings;
  const includeDeleted = currentUser.role === "ADMIN" && showDeleted === "1";
  const includePast = showPast === "1";

  const trainerCandidates =
    currentUser.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "TRAINER"] } },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : [{ id: currentUser.id, name: currentUser.name, email: currentUser.email }];

  const lessonTypeCandidates = await prisma.lessonType.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const iconOptions = await getLessonTypeIconOptions();

  const attendeeCandidates = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const selectedMonth = parseMonthInput(month);
  const monthStart = new Date(selectedMonth.year, selectedMonth.month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(selectedMonth.year, selectedMonth.month + 1, 1, 0, 0, 0, 0);
  const previousMonth = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
  const nextMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 1);
  const now = new Date();
  const startsAtFrom = includePast
    ? monthStart
    : monthStart > now
      ? monthStart
      : now;

  const lessons = await prisma.lesson.findMany({
    where: {
      deletedAt: includeDeleted ? undefined : null,
      startsAt: {
        gte: startsAtFrom,
        lt: monthEnd,
      },
    },
    include: {
      course: { select: { id: true, name: true, trainerId: true, durationMinutes: true } },
      trainer: { select: { id: true, name: true } },
      lessonType: { select: { id: true, name: true, iconSvg: true, colorHex: true } },
      bookings: {
        select: {
          traineeId: true,
          status: true,
          attendanceStatus: true,
          trainee: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      waitlistEntries: {
        include: {
          trainee: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { bookings: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const lessonTypeIds = Array.from(new Set(lessons.map((lesson) => lesson.lessonTypeId).filter((value): value is string => Boolean(value))));
  const accessRows = lessonTypeIds.length > 0
    ? await prisma.userLessonTypeAccess.findMany({
        where: {
          userId: currentUser.id,
          lessonTypeId: { in: lessonTypeIds },
        },
        select: { lessonTypeId: true, mode: true },
      })
    : [];
  const accessByTypeId = new Map(accessRows.map((row) => [row.lessonTypeId, row.mode]));

  function effectiveAccessMode(lessonTypeId: string | null): "DENIED" | "REQUIRES_CONFIRMATION" | "ALLOWED" {
    if (!lessonTypeId) return "ALLOWED";
    if (currentUser.role !== "TRAINEE") return "ALLOWED";
    return accessByTypeId.get(lessonTypeId) ?? "REQUIRES_CONFIRMATION";
  }

  const grouped = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const key = dateKey(lesson.startsAt);
    const list = grouped.get(key) ?? [];
    list.push(lesson);
    grouped.set(key, list);
  }

  const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(monthStart);
    date.setDate(monthStart.getDate() + index);
    const key = dateKey(date);
    return {
      key,
      date,
      lessons: grouped.get(key) ?? [],
    };
  });

  const daysWithLessons = monthDays.filter((day) => day.lessons.length > 0);

  const dateFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
  const monthFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
    month: "long",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(safeLocale === "it" ? "it-IT" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const monthLabel = monthFmt.format(monthStart);
  const prevMonthHref = `/${locale}/lessons?month=${monthValue(previousMonth)}${includeDeleted ? "&showDeleted=1" : ""}${includePast ? "&showPast=1" : ""}`;
  const nextMonthHref = `/${locale}/lessons?month=${monthValue(nextMonth)}${includeDeleted ? "&showDeleted=1" : ""}${includePast ? "&showPast=1" : ""}`;
  const toggleDeletedHref = `/${locale}/lessons?month=${monthValue(monthStart)}${includeDeleted ? "" : "&showDeleted=1"}${includePast ? "&showPast=1" : ""}`;
  const togglePastHref = `/${locale}/lessons?month=${monthValue(monthStart)}${includeDeleted ? "&showDeleted=1" : ""}${includePast ? "" : "&showPast=1"}`;

  return (
    <section className="space-y-4">
      <LessonsFlashToast message={flash ?? null} type={flashType ?? null} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
        </div>

        <div className="inline-flex items-center gap-2 text-sm">
          <a className="text-[var(--foreground)] hover:underline" href={prevMonthHref}>
            {labels.prevMonth}
          </a>
          <span className="rounded-md bg-[var(--muted)] px-2 py-1 text-xs capitalize">{monthLabel}</span>
          <span className="rounded-md border border-[var(--surface-border)] px-2 py-1 text-xs">{labels.monthNavigationLabel}</span>
          <a className="text-[var(--foreground)] hover:underline" href={nextMonthHref}>
            {labels.nextMonth}
          </a>
          {currentUser.role === "ADMIN" ? (
            <a className="rounded-md border border-[var(--surface-border)] px-2 py-1 text-xs hover:bg-[var(--muted)]" href={toggleDeletedHref}>
              {includeDeleted ? labels.hideDeletedCta : labels.showDeletedCta}
            </a>
          ) : null}
          <a className="rounded-md border border-[var(--surface-border)] px-2 py-1 text-xs hover:bg-[var(--muted)]" href={togglePastHref}>
            {includePast ? labels.hidePastCta : labels.showPastCta}
          </a>
        </div>
      </header>

      <div className="space-y-3">
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{labels.standaloneTitle}</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{labels.standaloneDescription}</p>
            </div>
            <StandaloneLessonCreateDialog
              locale={locale}
              trainerCandidates={trainerCandidates}
              lessonTypeCandidates={lessonTypeCandidates}
              defaultTrainerId={currentUser.role === "TRAINER" ? currentUser.id : undefined}
              labels={{
                triggerCta: labels.createStandaloneCta,
                title: labels.standaloneTitle,
                description: labels.standaloneDescription,
                trainerLabel: labels.trainerLabel,
                standaloneDuration: labels.standaloneDuration,
                standaloneMaxAttendees: labels.standaloneMaxAttendees,
                standaloneCancellationWindow: labels.standaloneCancellationWindow,
                standaloneLessonType: labels.standaloneLessonType,
                lessonTitleLabel: labels.lessonTitleLabel,
                lessonDescriptionLabel: labels.lessonDescriptionLabel,
                startsAtLabel: labels.startsAtLabel,
                submitCta: labels.createStandaloneCta,
                processing: labels.processing,
                closeCta: labels.closeCta,
              }}
            />
          </div>
        </div>

        {daysWithLessons.length === 0 ? (
          <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4 text-sm text-[var(--muted-foreground)]">
            {labels.emptyDay}
          </div>
        ) : null}

        {daysWithLessons.map((day) => (
          <div key={day.key} className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
            <h3 className="text-sm font-semibold capitalize">{dateFmt.format(day.date)}</h3>

            <div className="mt-2 space-y-2">
              {day.lessons.map((lesson) => (
                (() => {
                  const isPastOrNow = lesson.startsAt <= now;
                  const isDeleted = Boolean(lesson.deletedAt);
                  const currentUserBooking = lesson.bookings.find((booking) => booking.trainee.id === currentUser.id) ?? null;
                  const isBookedByCurrentUser = Boolean(currentUserBooking);
                  const isPendingByCurrentUser = currentUserBooking?.status === "PENDING";
                  const isQueuedByCurrentUser = lesson.waitlistEntries.some((entry) => entry.trainee.id === currentUser.id);
                  const pendingApprovalsCount = lesson.bookings.filter((booking) => booking.status === "PENDING").length;
                  const canManageLesson = currentUser.role === "ADMIN" || lesson.trainerId === currentUser.id;
                  const lessonTypeColor = lesson.lessonType ? sanitizeLessonTypeColor(lesson.lessonType.colorHex) : null;
                  const cardBorderStyle: CSSProperties["borderStyle"] = isBookedByCurrentUser ? "solid" : "dashed";
                  const cardStyle: CSSProperties | undefined = lessonTypeColor
                    ? {
                        backgroundColor: hexToRgba(lessonTypeColor, 0.16),
                        borderColor: hexToRgba(lessonTypeColor, 0.7),
                        borderWidth: isBookedByCurrentUser ? 1 : 2,
                        borderStyle: cardBorderStyle,
                      }
                    : {
                        borderColor: "var(--surface-border)",
                        borderWidth: isBookedByCurrentUser ? 1 : 2,
                        borderStyle: cardBorderStyle,
                      };
                  const isAccessDenied = effectiveAccessMode(lesson.lessonTypeId) === "DENIED";
                  const cancellationDeadline = new Date(lesson.startsAt.getTime() - lesson.cancellationWindowHours * 60 * 60 * 1000);
                  const canBook =
                    !isDeleted &&
                    lesson.status === "SCHEDULED" &&
                    lesson.startsAt > now &&
                    !isAccessDenied &&
                    !isBookedByCurrentUser &&
                    !isQueuedByCurrentUser;
                  const canUnbook = !isDeleted && isBookedByCurrentUser && now <= cancellationDeadline;
                  return (
                <div
                  key={lesson.id}
                  className={[
                    "rounded-md border p-2 text-sm",
                    isAccessDenied ? "opacity-50 saturate-0" : "",
                    lessonDifferenceReasons({
                      isCustomized: lesson.isCustomized,
                      startsAt: lesson.startsAt,
                      endsAt: lesson.endsAt,
                      sourceStartTime: lesson.sourceStartTime,
                      trainerId: lesson.trainerId,
                      course: lesson.course,
                    }).length > 0
                      ? "ring-1 ring-amber-400/70"
                      : "border-[var(--surface-border)]",
                  ].join(" ")}
                  style={cardStyle}
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <LessonDetailsDialogTrigger
                        locale={locale}
                        lesson={{
                          id: lesson.id,
                          title: lesson.title?.trim() || lesson.course?.name || "-",
                          description: lesson.description ?? null,
                          startsAt: lesson.startsAt.toISOString(),
                          endsAt: lesson.endsAt.toISOString(),
                          trainerName: lesson.trainer?.name ?? null,
                          occupancy: `${lesson._count.bookings}/${lesson.maxAttendees}`,
                          queueLength: lesson.waitlistEntries.length,
                          canViewWaitlist: true,
                          isCourseLesson: Boolean(lesson.course?.id),
                          lessonTypeName: lesson.lessonType?.name ?? null,
                          lessonTypeIcon: lesson.lessonType
                            ? sanitizeLessonTypeIconPath(lesson.lessonType.iconSvg, iconOptions)
                            : null,
                          lessonTypeColor: lesson.lessonType ? sanitizeLessonTypeColor(lesson.lessonType.colorHex) : null,
                          canBroadcast: canManageLesson,
                        }}
                        labels={{
                          detailsTitle: labels.detailsTitle,
                          detailsDescription: labels.detailsDescription,
                          startsAtLabel: labels.startsAtLabel,
                          endsAtLabel: bookingLabels.endsAtLabel,
                          trainerLabel: labels.trainerLabel,
                          bookedLabel: labels.bookedLabel,
                          queuedLabel: bookingLabels.queuedLabel,
                          closeCta: labels.closeCta,
                          courseTag: labels.courseTag,
                          lessonDescriptionLabel: labels.lessonDescriptionLabel,
                          notifySectionTitle: labels.notifySectionTitle,
                          notifyMessagePlaceholder: labels.notifyMessagePlaceholder,
                          notifySendCta: labels.notifySendCta,
                        }}
                        manage={canManageLesson ? {
                      lesson: {
                        id: lesson.id,
                        canEditMain: !lesson.course?.id && !isPastOrNow && !isDeleted,
                        title: lesson.title ?? "",
                        description: lesson.description ?? "",
                        startsAt: toDateTimeLocalValue(lesson.startsAt),
                        durationMinutes: Math.max(1, Math.round((lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60000)),
                        maxAttendees: lesson.maxAttendees,
                        cancellationWindowHours: lesson.cancellationWindowHours,
                        trainerId: lesson.trainer?.id ?? "",
                        lessonTypeId: lesson.lessonTypeId ?? "",
                        canManageTrainer: currentUser.role === "ADMIN" && !isPastOrNow && !isDeleted,
                        canManageAttendance: lesson.endsAt <= now && !isDeleted,
                        attendees: lesson.bookings.filter((booking) => booking.status === "CONFIRMED").map((booking) => ({
                          id: booking.trainee.id,
                          name: booking.trainee.name,
                          email: booking.trainee.email,
                        })),
                        attendeeAttendance: Object.fromEntries(
                          lesson.bookings
                            .filter((booking) => booking.status === "CONFIRMED")
                            .map((booking) => [booking.trainee.id, booking.attendanceStatus ?? null])
                        ),
                        pendingApprovals: lesson.bookings.filter((booking) => booking.status === "PENDING").map((booking) => ({
                          id: booking.trainee.id,
                          name: booking.trainee.name,
                          email: booking.trainee.email,
                        })),
                        waitlist: lesson.waitlistEntries.map((entry) => ({
                          id: entry.trainee.id,
                          name: entry.trainee.name,
                          email: entry.trainee.email,
                        })),
                      },
                      trainerCandidates,
                      lessonTypeCandidates,
                      attendeeCandidates,
                      canBroadcastToAttendees: true,
                      canGrantOpenAccess: currentUser.role === "ADMIN",
                      labels: {
                        title: labels.manageTitle,
                        description: labels.manageDescription,
                        tabMain: labels.manageTabMain,
                        tabPeople: labels.manageTabPeople,
                        startsAtLabel: labels.startsAtLabel,
                        trainerLabel: labels.trainerLabel,
                        standaloneDuration: labels.standaloneDuration,
                        standaloneMaxAttendees: labels.standaloneMaxAttendees,
                        standaloneCancellationWindow: labels.standaloneCancellationWindow,
                        standaloneLessonType: labels.standaloneLessonType,
                        lessonTitleLabel: labels.lessonTitleLabel,
                        lessonDescriptionLabel: labels.lessonDescriptionLabel,
                        updateStandaloneCta: labels.updateStandaloneCta,
                        updateTrainerCta: labels.updateTrainerCta,
                        attendeesLabel: labels.attendeesLabel,
                        noAttendees: labels.noAttendees,
                        attendeeSelectLabel: labels.attendeeSelectLabel,
                        addAttendeeCta: labels.addAttendeeCta,
                        removeAttendeeCta: labels.removeAttendeeCta,
                        markAttendancePresentCta: labels.markAttendancePresentCta,
                        markAttendanceNoShowCta: labels.markAttendanceNoShowCta,
                        attendanceStatusLabel: labels.attendanceStatusLabel,
                        attendanceStatusPresent: labels.attendanceStatusPresent,
                        attendanceStatusNoShow: labels.attendanceStatusNoShow,
                        attendanceStatusUnmarked: labels.attendanceStatusUnmarked,
                        pendingApprovalsLabel: labels.pendingApprovalsLabel,
                        noPendingApprovals: labels.noPendingApprovals,
                        confirmPendingCta: labels.confirmPendingCta,
                        confirmPendingAndGrantAccessCta: labels.confirmPendingAndGrantAccessCta,
                        rejectPendingCta: labels.rejectPendingCta,
                        waitlistLabel: labels.waitlistLabel,
                        noWaitlist: labels.noWaitlist,
                        confirmWaitlistCta: labels.confirmWaitlistCta,
                        removeWaitlistCta: labels.removeWaitlistCta,
                        processing: labels.processing,
                        closeCta: labels.closeCta,
                        manageTriggerLabel: labels.manageTriggerLabel,
                        notifySectionTitle: labels.notifySectionTitle,
                        notifyMessageLabel: labels.notifyMessageLabel,
                        notifyMessagePlaceholder: labels.notifyMessagePlaceholder,
                        notifySendCta: labels.notifySendCta,
                      },
                        } : undefined}
                        trigger={(
                          <div
                            className="w-full cursor-pointer rounded text-left hover:opacity-95"
                            aria-label={labels.detailsTriggerLabel}
                            title={labels.detailsTriggerLabel}
                          >
                            <div className="flex items-center gap-3">
                              {lesson.lessonType ? (
                                <LessonTypeIcon
                                  iconPath={sanitizeLessonTypeIconPath(lesson.lessonType.iconSvg, iconOptions)}
                                  colorHex={sanitizeLessonTypeColor(lesson.lessonType.colorHex)}
                                  size={22}
                                  title={lesson.lessonType.name}
                                />
                              ) : null}
                              <div className="min-w-0">
                                <p className="truncate text-base font-semibold">{lesson.title?.trim() || lesson.course?.name || "-"}</p>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                  {timeFmt.format(lesson.startsAt)} - {timeFmt.format(lesson.endsAt)}
                                </p>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                  {labels.trainerLabel}: {lesson.trainer?.name ?? "-"} ·{" "}
                                  <span className="inline-flex items-center gap-1">
                                    {currentUser.role === "ADMIN" && pendingApprovalsCount > 0 ? (
                                      <span title={`${labels.pendingApprovalsLabel}: ${pendingApprovalsCount}`}>
                                        <AlertTriangle
                                          className="h-3.5 w-3.5 text-[var(--danger-fg)] dark:text-red-400"
                                          aria-label={`${labels.pendingApprovalsLabel}: ${pendingApprovalsCount}`}
                                        />
                                      </span>
                                    ) : (
                                      <Users className="h-3.5 w-3.5" />
                                    )}
                                    {labels.bookedLabel}: {lesson._count.bookings}/{lesson.maxAttendees}
                                  </span>
                                </p>
                                {lesson.description ? <p className="text-xs text-[var(--muted-foreground)]">{lesson.description}</p> : null}
                                <div className="mt-1 inline-flex flex-wrap items-center gap-1">
                                  {lesson.course?.id ? (
                                    <Badge variant="info" className="text-[10px]">
                                      {labels.courseTag}
                                    </Badge>
                                  ) : null}
                                  {isDeleted ? (
                                    <Badge variant="warning" className="text-[10px]">
                                      {labels.deletedTag}
                                    </Badge>
                                  ) : null}
                                  {(() => {
                                    const reasons = lessonDifferenceReasons({
                                      isCustomized: lesson.isCustomized,
                                      startsAt: lesson.startsAt,
                                      endsAt: lesson.endsAt,
                                      sourceStartTime: lesson.sourceStartTime,
                                      trainerId: lesson.trainerId,
                                      course: lesson.course,
                                    });
                                    if (reasons.length === 0) return null;

                                    return (
                                      <div className="inline-flex items-center gap-1">
                                        <Badge variant="warning" className="text-[10px]">
                                          {labels.modifiedTag}
                                        </Badge>
                                        <span className="text-[10px] text-amber-700 dark:text-amber-300">
                                          {labels.modifiedReasonsLabel}: {reasons
                                            .map((reason) => (reason === "trainer" ? labels.modifiedReasonTrainer : labels.modifiedReasonTime))
                                            .join(", ")}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-1 self-center">
                    {isAccessDenied ? null : !isQueuedByCurrentUser ? (
                      <BookingBadgeToggle
                        locale={locale}
                        lessonId={lesson.id}
                        isBooked={isBookedByCurrentUser}
                        isPendingApproval={isPendingByCurrentUser}
                        canBook={canBook}
                        canUnbook={canUnbook}
                        labels={{
                          bookCta: bookingLabels.bookCta,
                          bookedCta: bookingLabels.youAreBooked,
                          pendingCta: bookingLabels.awaitingConfirmation,
                          processing: bookingLabels.processing,
                          confirmUnbookTitle: bookingLabels.confirmUnbookTitle,
                          confirmUnbookDescription: bookingLabels.confirmUnbookDescription,
                          confirmUnbookCta: bookingLabels.confirmUnbookCta,
                          confirmKeepBookingCta: bookingLabels.confirmKeepBookingCta,
                        }}
                      />
                    ) : (
                      <Badge variant="warning">{bookingLabels.youAreQueued}</Badge>
                    )}
                      {canManageLesson && !isDeleted ? (
                        <AlertDialog>
                          <AlertDialogTrigger
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--danger-hover)] text-[var(--danger-fg)] hover:bg-[var(--danger-bg)] dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                            title={labels.deleteLessonCta}
                            aria-label={labels.deleteLessonCta}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{labels.confirmDeleteLessonTitle}</AlertDialogTitle>
                              <AlertDialogDescription>{labels.confirmDeleteLessonDescription}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="inline-flex h-9 items-center rounded-md border px-3 text-sm">
                                {labels.closeCta}
                              </AlertDialogCancel>
                              <form id={`delete-lesson-${lesson.id}`} action={deleteStandaloneLessonAction}>
                                <input type="hidden" name="locale" value={locale} />
                                <input type="hidden" name="month" value={monthValue(monthStart)} />
                                {includeDeleted ? <input type="hidden" name="showDeleted" value="1" /> : null}
                                {includePast ? <input type="hidden" name="showPast" value="1" /> : null}
                                <input type="hidden" name="lessonId" value={lesson.id} />
                                <button
                                  type="submit"
                                  className="inline-flex h-9 items-center rounded-md bg-[var(--destructive-bg)] px-3 text-sm text-[var(--destructive-fg)] hover:bg-[var(--destructive-hover)]"
                                >
                                  {labels.deleteLessonCta}
                                </button>
                              </form>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
                      {canManageLesson && isDeleted ? (
                        <form action={restoreLessonAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="month" value={monthValue(monthStart)} />
                          {includeDeleted ? <input type="hidden" name="showDeleted" value="1" /> : null}
                          {includePast ? <input type="hidden" name="showPast" value="1" /> : null}
                          <input type="hidden" name="lessonId" value={lesson.id} />
                          <button
                            type="submit"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--success-hover)] text-[var(--success-fg)] hover:bg-[var(--success-bg)] dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                            title={labels.restoreLessonCta}
                            aria-label={labels.restoreLessonCta}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      ) : null}
                  </div>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
