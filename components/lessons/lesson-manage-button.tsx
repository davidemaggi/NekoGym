"use client";

import type React from "react";
import { ChevronRight } from "lucide-react";

import { LessonDetailsDialogTrigger, type LessonPerson } from "@/components/lessons/lesson-details-dialog-trigger";
import type { Dictionary } from "@/lib/i18n";
import { textLinkActionClass } from "@/lib/ui-classes";

type Person = LessonPerson;

/** The fields the manage dialog needs; BookingsLesson and the home rows both satisfy it. */
export type ManageableLesson = {
  id: string;
  title: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string;
  startsAtLocal: string;
  durationMinutes: number;
  hasStarted: boolean;
  maxAttendees: number;
  cancellationWindowHours: number;
  trainerId: string;
  trainerName: string | null;
  lessonTypeId: string;
  lessonTypeName: string | null;
  lessonTypeIcon: string | null;
  lessonTypeColor: string | null;
  isCourseLesson: boolean;
  courseName: string;
  courseId: string | null;
  /** The course's Markdown description, shown in the dialog of its lessons. */
  courseDescription: string | null;
  occupancy: string;
  queueLength: number;
  canViewWaitlist: boolean;
  canManageLesson: boolean;
  canManageAttendance: boolean;
  attendees: Person[];
  attendeeAttendance: Record<string, "PRESENT" | "NO_SHOW" | null>;
  pendingApprovals: Person[];
  waitlist: Person[];
};

type LessonManageButtonProps = {
  locale: string;
  lesson: ManageableLesson;
  labels: Dictionary["bookings"];
  lessonCreateLabels: Dictionary["lessonsPage"];
  canUpdateTrainer: boolean;
  isAdmin: boolean;
  trainerCandidates: Array<{ id: string; name: string }>;
  lessonTypeCandidates: Array<{ id: string; name: string }>;
  attendeeCandidates: Person[];
  triggerLabel?: string;
  /** "link" matches the to-do actions on the home (underlined text with chevron). */
  triggerVariant?: "button" | "link";
  /** Extra actions rendered in the dialog footer (e.g. "Annulla lezione"). */
  footerSlot?: React.ReactNode;
};

/** Opens the shared lesson dialog (info, people, attendance, broadcast) for staff. */
export function LessonManageButton({
  locale,
  lesson,
  labels,
  lessonCreateLabels,
  canUpdateTrainer,
  isAdmin,
  trainerCandidates,
  lessonTypeCandidates,
  attendeeCandidates,
  triggerLabel,
  triggerVariant = "button",
  footerSlot,
}: LessonManageButtonProps) {
  const manageLabels = {
    title: lessonCreateLabels.manageTitle,
    description: lessonCreateLabels.manageDescription,
    tabMain: lessonCreateLabels.manageTabMain,
    tabPeople: lessonCreateLabels.manageTabPeople,
    startsAtLabel: lessonCreateLabels.startsAtLabel,
    trainerLabel: lessonCreateLabels.trainerLabel,
    standaloneDuration: lessonCreateLabels.standaloneDuration,
    standaloneMaxAttendees: lessonCreateLabels.standaloneMaxAttendees,
    standaloneCancellationWindow: lessonCreateLabels.standaloneCancellationWindow,
    standaloneLessonType: lessonCreateLabels.standaloneLessonType,
    lessonTitleLabel: lessonCreateLabels.lessonTitleLabel,
    lessonDescriptionLabel: lessonCreateLabels.lessonDescriptionLabel,
    updateStandaloneCta: lessonCreateLabels.updateStandaloneCta,
    updateTrainerCta: lessonCreateLabels.updateTrainerCta,
    attendeesLabel: lessonCreateLabels.attendeesLabel,
    noAttendees: lessonCreateLabels.noAttendees,
    attendeeSelectLabel: lessonCreateLabels.attendeeSelectLabel,
    addAttendeeCta: lessonCreateLabels.addAttendeeCta,
    removeAttendeeCta: lessonCreateLabels.removeAttendeeCta,
    markAttendancePresentCta: lessonCreateLabels.markAttendancePresentCta,
    markAttendanceNoShowCta: lessonCreateLabels.markAttendanceNoShowCta,
    attendanceStatusLabel: lessonCreateLabels.attendanceStatusLabel,
    attendanceStatusPresent: lessonCreateLabels.attendanceStatusPresent,
    attendanceStatusNoShow: lessonCreateLabels.attendanceStatusNoShow,
    attendanceStatusUnmarked: lessonCreateLabels.attendanceStatusUnmarked,
    pendingApprovalsLabel: lessonCreateLabels.pendingApprovalsLabel,
    noPendingApprovals: lessonCreateLabels.noPendingApprovals,
    confirmPendingCta: lessonCreateLabels.confirmPendingCta,
    confirmPendingAndGrantAccessCta: lessonCreateLabels.confirmPendingAndGrantAccessCta,
    rejectPendingCta: lessonCreateLabels.rejectPendingCta,
    waitlistLabel: lessonCreateLabels.waitlistLabel,
    noWaitlist: lessonCreateLabels.noWaitlist,
    confirmWaitlistCta: lessonCreateLabels.confirmWaitlistCta,
    removeWaitlistCta: lessonCreateLabels.removeWaitlistCta,
    processing: lessonCreateLabels.processing,
    closeCta: lessonCreateLabels.closeCta,
    manageTriggerLabel: lessonCreateLabels.manageTriggerLabel,
    notifySectionTitle: lessonCreateLabels.notifySectionTitle,
    notifyMessageLabel: lessonCreateLabels.notifyMessageLabel,
    notifyMessagePlaceholder: lessonCreateLabels.notifyMessagePlaceholder,
    notifySendCta: lessonCreateLabels.notifySendCta,
  };

  return (
    <LessonDetailsDialogTrigger
      locale={locale}
      footerSlot={footerSlot}
      lesson={{
        id: lesson.id,
        title: lesson.title ?? lesson.courseName,
        description: lesson.description,
        startsAt: lesson.startsAt,
        endsAt: lesson.endsAt,
        trainerName: lesson.trainerName,
        occupancy: lesson.occupancy,
        queueLength: lesson.queueLength,
        canViewWaitlist: lesson.canViewWaitlist,
        isCourseLesson: lesson.isCourseLesson,
        courseId: lesson.courseId,
        courseName: lesson.courseName,
        courseDescription: lesson.courseDescription,
        lessonTypeName: lesson.lessonTypeName,
        lessonTypeIcon: lesson.lessonTypeIcon,
        lessonTypeColor: lesson.lessonTypeColor,
        canBroadcast: lesson.canManageLesson,
      }}
      labels={{
        detailsTitle: labels.detailsTitle,
        detailsDescription: labels.detailsDescription,
        startsAtLabel: labels.startsAtLabel,
        endsAtLabel: labels.endsAtLabel,
        trainerLabel: labels.trainerLabel,
        bookedLabel: labels.bookedLabel,
        queuedLabel: labels.queuedLabel,
        closeCta: labels.closeCta,
        courseTag: labels.courseTag,
        lessonDescriptionLabel: lessonCreateLabels.lessonDescriptionLabel,
        notifySectionTitle: lessonCreateLabels.notifySectionTitle,
        notifyMessagePlaceholder: lessonCreateLabels.notifyMessagePlaceholder,
        notifySendCta: lessonCreateLabels.notifySendCta,
      }}
      manage={{
        lesson: {
          id: lesson.id,
          canEditMain: !lesson.isCourseLesson && !lesson.hasStarted,
          title: lesson.title ?? "",
          description: lesson.description ?? "",
          startsAt: lesson.startsAtLocal,
          durationMinutes: lesson.durationMinutes,
          maxAttendees: lesson.maxAttendees,
          cancellationWindowHours: lesson.cancellationWindowHours,
          trainerId: lesson.trainerId,
          lessonTypeId: lesson.lessonTypeId,
          canManageTrainer: canUpdateTrainer && !lesson.hasStarted,
          attendees: lesson.attendees,
          attendeeAttendance: lesson.attendeeAttendance,
          canManageAttendance: lesson.canManageAttendance,
          pendingApprovals: lesson.pendingApprovals,
          waitlist: lesson.waitlist,
        },
        trainerCandidates,
        lessonTypeCandidates,
        attendeeCandidates,
        canBroadcastToAttendees: lesson.canManageLesson,
        canGrantOpenAccess: isAdmin && lesson.canManageLesson,
        labels: manageLabels,
      }}
      trigger={
        triggerVariant === "link" ? (
          <span className={textLinkActionClass}>
            {triggerLabel ?? labels.manageCta}
            <ChevronRight size={16} aria-hidden="true" />
          </span>
        ) : (
          <span className="inline-flex h-11 items-center gap-2 rounded-xl border-[1.5px] border-[var(--foreground)] bg-[var(--surface)] px-4 text-[15px] font-semibold transition-colors hover:bg-[var(--muted)]">
            {triggerLabel ?? labels.manageCta}
          </span>
        )
      }
    />
  );
}
