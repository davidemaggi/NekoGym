"use client";

import { getAppTimeParts } from "@/lib/date-time";
import type { PlanUsage } from "@/lib/plan-usage";

import { useId, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarX2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Lock,
  Plus,
  ShieldCheck,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  bookLessonAction,
  setBookingsViewAction,
  unbookLessonAction,
  type BookingsViewValue,
} from "@/app/[locale]/(app)/bookings/actions";
import { StandaloneLessonCreateDialog } from "@/app/[locale]/(app)/lessons/standalone-lesson-create-dialog";
import { LessonManageButton } from "@/components/lessons/lesson-manage-button";
import { PendingApprovalActions } from "@/components/lessons/pending-approval-actions";
import { PlanUsageTag } from "@/components/users/plan-usage-tag";
import { UserQuickProfileTooltip } from "@/components/users/user-quick-profile-tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PassCard, fill, type BookingPass } from "@/components/bookings/pass-card";
import { Button } from "@/components/ui/button";
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
import { MarkdownView } from "@/components/ui/markdown-view";
import { SegmentedTabs } from "@/components/settings/settings-ui";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
type Person = {
  id: string;
  name: string;
  email: string;
  planUsage?: PlanUsage;
  /** Pending requests only: why the certificate made this booking wait for approval. */
  approvalNote?: string | null;
};

export type BookingsLesson = {
  id: string;
  dayKey: string;
  title: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string;
  startsAtLocal: string;
  timeLabel: string;
  endTimeLabel: string;
  stampDateLabel: string;
  cancelDeadlineLabel: string;
  durationMinutes: number;
  hasStarted: boolean;
  hasEnded: boolean;
  maxAttendees: number;
  cancellationWindowHours: number;
  bookedCount: number;
  availableSeats: number;
  isBookedByCurrentUser: boolean;
  isPendingByCurrentUser: boolean;
  isQueuedByCurrentUser: boolean;
  isAccessDenied: boolean;
  requiresConfirmation: boolean;
  /** Why the medical certificate makes this booking wait for approval, or null. */
  certificateNote: string | null;
  canViewWaitlist: boolean;
  queueLength: number;
  pendingApprovalsCount: number;
  canBook: boolean;
  canUnbook: boolean;
  canManageLesson: boolean;
  occupancy: string;
  isCourseLesson: boolean;
  courseName: string;
  courseId: string | null;
  courseDescription: string | null;
  lessonTypeName: string | null;
  lessonTypeId: string;
  lessonTypeIcon: string | null;
  lessonTypeColor: string | null;
  trainerId: string;
  trainerName: string | null;
  attendees: Person[];
  attendeeAttendance: Record<string, "PRESENT" | "NO_SHOW" | null>;
  canManageAttendance: boolean;
  pendingApprovals: Person[];
  waitlist: Person[];
};

export type BookingsDay = {
  key: string;
  weekdayLabel: string;
  dayNumberLabel: string;
  longLabel: string;
  isToday: boolean;
  isPast: boolean;
  isClosed: boolean;
  /** Month view: false for the leading/trailing days that belong to the neighbouring months. */
  inMonth: boolean;
  lessonCount: number;
  hasOwnBooking: boolean;
  /** Lessons of the day the user is booked on (confirmed or pending). */
  ownBookingCount: number;
};

export type { BookingPass };

type UpcomingBooking = {
  id: string;
  dayKey: string;
  title: string;
  whenLabel: string;
  isPending: boolean;
  lessonTypeIcon: string | null;
  lessonTypeColor: string | null;
};

type BookingsLabels = Dictionary["bookings"];
type LessonCreateLabels = Dictionary["lessonsPage"];

type BookingsManagerProps = {
  locale: string;
  labels: BookingsLabels;
  lessonCreateLabels: LessonCreateLabels;
  lessons: BookingsLesson[];
  days: BookingsDay[];
  initialDayKey: string;
  view: BookingsViewValue;
  /** "2–8 nov" for the week, "novembre 2026" for the month. */
  periodLabel: string;
  /** Previous/next week (day and week views) or first day of the previous/next month. */
  previousKey: string;
  nextKey: string;
  todayKey: string;
  pass: BookingPass | null;
  upcoming: UpcomingBooking[];
  canCreateStandaloneLesson: boolean;
  canUpdateTrainer: boolean;
  defaultTrainerId?: string;
  trainerCandidates: Array<{ id: string; name: string }>;
  lessonTypeCandidates: Array<{ id: string; name: string }>;
  attendeeCandidates: Person[];
  openWeekdays: Weekday[];
  closedDates: string[];
  isAdmin: boolean;
};


function bookingsHref(locale: string, dayKey: string, view: BookingsViewValue) {
  return `/${locale}/bookings?day=${dayKey}&view=${view.toLowerCase()}`;
}

const navArrowClass =
  "inline-flex h-11 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] sm:w-11";

/* ------------------------------------------------------------------ */
/* Row action: Prenota / stamp / queue                                 */
/* ------------------------------------------------------------------ */

function StampFace({ label, detail, dashed = false, neutral = false }: { label: string; detail?: string; dashed?: boolean; neutral?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[5.75rem] flex-col items-center justify-center rounded-lg border-2 px-2 py-1.5 text-center leading-tight sm:min-w-[6.75rem] sm:px-2.5",
        dashed ? "border-dashed" : "",
        neutral ? "border-[var(--muted-foreground)] text-[var(--muted-foreground)]" : "border-[var(--stamp)] text-[var(--stamp)]"
      )}
    >
      <span className="text-[11px] font-extrabold uppercase tracking-[0.08em]">{label}</span>
      {detail ? <span className="tabular text-[15px] font-bold">{detail}</span> : null}
    </span>
  );
}

function BookingAction({
  lesson,
  locale,
  labels,
  justStamped,
  onBooked,
}: {
  lesson: BookingsLesson;
  locale: string;
  labels: BookingsLabels;
  justStamped: boolean;
  onBooked: (lessonId: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run(kind: "book" | "unbook") {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("lessonId", lesson.id);
      formData.set("locale", locale);
      const result = kind === "book" ? await bookLessonAction(formData) : await unbookLessonAction(formData);
      if (result.ok) {
        toast.success(result.message);
        if (kind === "book") onBooked(lesson.id);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  if (lesson.isBookedByCurrentUser) {
    const face = (
      <StampFace
        label={lesson.isPendingByCurrentUser ? labels.stampPending : labels.stampBooked}
        detail={`${lesson.stampDateLabel} · ${lesson.timeLabel}`}
        dashed={lesson.isPendingByCurrentUser}
      />
    );
    if (!lesson.canUnbook) {
      return (
        <span className={justStamped ? "stamp-land inline-block" : "inline-block"} title={labels.cancelClosed}>
          {face}
          <span className="sr-only">. {labels.cancelClosed}</span>
        </span>
      );
    }
    return (
      <>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          aria-label={`${lesson.isPendingByCurrentUser ? labels.stampPending : labels.stampBooked} ${lesson.stampDateLabel} ${lesson.timeLabel}. ${labels.unbookCta}`}
          className={cn(
            "rounded-xl p-1 transition-colors hover:bg-[var(--stamp-soft)] disabled:opacity-60",
            justStamped ? "stamp-land" : ""
          )}
        >
          {face}
        </button>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{labels.confirmUnbookTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {lesson.title ?? lesson.courseName} · {lesson.stampDateLabel} {lesson.timeLabel}. {labels.confirmUnbookDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline">{labels.confirmKeepBookingCta}</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive" onClick={() => run("unbook")}>
                  {labels.confirmUnbookCta}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (lesson.isQueuedByCurrentUser) {
    return <StampFace label={labels.stampQueued} dashed neutral />;
  }

  if (lesson.isAccessDenied) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted-foreground)]">
        <Lock size={15} aria-hidden="true" />
        {labels.accessDenied}
      </span>
    );
  }

  if (lesson.hasStarted) {
    return lesson.hasEnded ? (
      <span className="text-sm font-semibold text-[var(--muted-foreground)]">{labels.lessonEnded}</span>
    ) : (
      <span className="text-sm font-semibold text-[var(--success-fg)]">{labels.lessonInProgress}</span>
    );
  }

  const isFull = lesson.availableSeats <= 0;
  return (
    <Button
      variant="outline"
      disabled={!lesson.canBook || isPending}
      onClick={() => run("book")}
      className={cn(
        "min-w-[5.75rem] px-3 sm:min-w-[6.75rem] sm:px-4",
        // Waitlist keeps the same weight as Prenota, marked by the dashed perforation.
        isFull ? "h-auto min-h-11 whitespace-normal border-dashed py-1.5 text-sm leading-tight sm:text-[15px]" : ""
      )}
      aria-label={`${isFull ? labels.joinQueueCta : labels.bookCta}: ${lesson.title ?? lesson.courseName}, ${lesson.timeLabel}`}
    >
      {isPending ? labels.processing : isFull ? labels.joinQueueCta : labels.bookCta}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson row                                                          */
/* ------------------------------------------------------------------ */

function LessonRow({
  lesson,
  locale,
  labels,
  lessonCreateLabels,
  expanded,
  onToggle,
  justStamped,
  onBooked,
  showPlanCost,
  manage,
  dimmed,
}: {
  lesson: BookingsLesson;
  locale: string;
  labels: BookingsLabels;
  lessonCreateLabels: LessonCreateLabels;
  expanded: boolean;
  onToggle: () => void;
  justStamped: boolean;
  onBooked: (lessonId: string) => void;
  showPlanCost: "fixed" | "period" | null;
  manage: ReactNode;
  dimmed: boolean;
}) {
  const panelId = useId();
  const name = lesson.title ?? lesson.courseName;
  const seats =
    lesson.availableSeats <= 0
      ? lesson.queueLength > 0
        ? `${labels.full} · ${fill(labels.queueCount, { n: lesson.queueLength })}`
        : labels.full
      : lesson.availableSeats === 1
        ? labels.seatFreeOne
        : fill(labels.seatsFree, { n: lesson.availableSeats });
  const meta = [lesson.trainerName, seats].filter(Boolean).join(" · ");
  // Another row is open, or this one cannot be booked: step back to secondary ink.
  const quiet = dimmed || lesson.isAccessDenied || (lesson.hasStarted && !lesson.isBookedByCurrentUser);

  return (
    <li
      id={`lesson-${lesson.id}`}
      className={cn(
        "scroll-mt-24 border-b border-[var(--rule)] transition-colors duration-150 last:border-b-0 lg:rounded-xl",
        expanded ? "bg-[var(--surface)] shadow-[var(--shadow-lift)]" : ""
      )}
    >
      <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3.5 sm:grid-cols-[4.25rem_minmax(0,1fr)_auto] sm:px-6 lg:px-5">
        {/* Phones: the disclosure chevron sits under the duration, so the meta line keeps its full width.
            The time column is a pointer shortcut to the same toggle; the name button stays the accessible control. */}
        <div
          onClick={onToggle}
          className={cn("cursor-pointer leading-none transition-colors duration-150 sm:cursor-auto", quiet ? "text-[var(--muted-foreground)]" : "")}
        >
          <span className="tabular block text-[1.375rem] font-bold sm:text-[1.625rem]">{lesson.timeLabel}</span>
          <span className="tabular mt-1 flex items-center gap-1 text-[13px] font-medium text-[var(--muted-foreground)]">
            {lesson.durationMinutes} min
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={cn("transition-transform duration-150 sm:hidden", expanded ? "rotate-180" : "")}
            />
          </span>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={fill(labels.showDetails, { name })}
          className="-my-2 flex min-h-11 min-w-0 items-center gap-2 rounded-xl py-2 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className={cn("flex items-start gap-2 text-[17px] font-semibold leading-snug transition-colors duration-150", quiet ? "text-[var(--muted-foreground)]" : "")}>
              {lesson.lessonTypeIcon ? (
                <LessonTypeIcon iconPath={lesson.lessonTypeIcon} colorHex={lesson.lessonTypeColor} size={18} className="mt-[3px]" />
              ) : null}
              <span className="min-w-0 break-words sm:truncate">{name}</span>
            </span>
            <span className="mt-0.5 block text-[15px] text-[var(--muted-foreground)] sm:truncate">
              {meta}
              {/* Staff see open requests without expanding the row. */}
              {lesson.canManageLesson && lesson.pendingApprovals.length > 0 ? (
                <span className="font-semibold text-[var(--warning-fg)]">
                  {" · "}
                  {fill(labels.pendingToConfirm, { n: lesson.pendingApprovals.length })}
                </span>
              ) : null}
            </span>
          </span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={cn("hidden shrink-0 text-[var(--muted-foreground)] transition-transform duration-150 sm:block", expanded ? "rotate-180" : "")}
          />
        </button>

        <div className="justify-self-end">
          <BookingAction lesson={lesson} locale={locale} labels={labels} justStamped={justStamped} onBooked={onBooked} />
        </div>
      </div>

      <div id={panelId} hidden={!expanded} className="pb-4 pl-[5.5rem] pr-4 sm:pl-[6.75rem] sm:pr-6 lg:pl-[6.25rem] lg:pr-5">
        <ul className="space-y-2 text-[15px]">
          <li className="flex items-center gap-2.5">
            <Clock3 size={16} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
            <span className="tabular">{lesson.timeLabel}–{lesson.endTimeLabel}</span>
            {lesson.lessonTypeName ? <span className="text-[var(--muted-foreground)]">· {lesson.lessonTypeName}</span> : null}
          </li>
          {lesson.isCourseLesson ? (
            <li className="flex items-center gap-2.5">
              <BookOpen size={16} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
              <span>
                {labels.courseTag}{" "}
                {lesson.courseId ? (
                  <Link
                    href={`/${locale}/courses/${lesson.courseId}`}
                    className="font-semibold underline decoration-[1.5px] underline-offset-4 hover:decoration-2"
                  >
                    {lesson.courseName}
                  </Link>
                ) : (
                  <span className="font-semibold">{lesson.courseName}</span>
                )}
              </span>
            </li>
          ) : null}
          {lesson.trainerName ? (
            <li className="flex items-center gap-2.5">
              <UserRound size={16} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
              {lesson.trainerName}
            </li>
          ) : null}
          {!lesson.hasStarted && (lesson.isBookedByCurrentUser || lesson.canBook) ? (
            <li className="flex items-center gap-2.5">
              <CalendarX2 size={16} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
              {lesson.isBookedByCurrentUser && !lesson.canUnbook
                ? labels.cancelClosed
                : fill(labels.cancelBy, { date: lesson.cancelDeadlineLabel })}
            </li>
          ) : null}
          {showPlanCost && lesson.canBook ? (
            <li className="flex items-center gap-2.5">
              <Ticket size={16} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
              {showPlanCost === "fixed" ? labels.costFixed : labels.costPeriod}
            </li>
          ) : null}
          {lesson.requiresConfirmation && lesson.canBook ? (
            <li className="flex items-start gap-2.5">
              <ShieldCheck size={16} aria-hidden="true" className="mt-[3px] shrink-0 text-[var(--muted-foreground)]" />
              <span>
                {labels.requiresConfirmation}
                {lesson.certificateNote ? (
                  <span className="block text-[var(--warning-fg)]">{lesson.certificateNote}</span>
                ) : null}
              </span>
            </li>
          ) : null}
          {lesson.canViewWaitlist ? (
            <li className="flex items-center gap-2.5">
              <Users size={16} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
              <span className="tabular">
                {labels.bookedLabel} {lesson.occupancy}
                {lesson.queueLength > 0 ? ` · ${labels.queuedLabel} ${lesson.queueLength}` : ""}
                {lesson.pendingApprovalsCount > 0 ? ` · ${lessonCreateLabels.pendingApprovalsLabel} ${lesson.pendingApprovalsCount}` : ""}
              </span>
            </li>
          ) : null}
        </ul>
        {lesson.description ? (
          <p className="mt-3 max-w-[65ch] text-[15px] text-[var(--muted-foreground)]">{lesson.description}</p>
        ) : null}
        {lesson.courseDescription ? <MarkdownView markdown={lesson.courseDescription} className="mt-3" /> : null}
        {lesson.canManageLesson && lesson.pendingApprovals.length > 0 ? (
          <section className="mt-4 max-w-xl">
            <h3 className="text-[15px] font-semibold">
              {lessonCreateLabels.pendingApprovalsLabel}{" "}
              <span className="tabular font-medium text-[var(--muted-foreground)]">{lesson.pendingApprovals.length}</span>
            </h3>
            <ul className="mt-1 divide-y divide-[var(--rule)]">
              {lesson.pendingApprovals.map((person) => (
                <li key={person.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <UserQuickProfileTooltip userId={person.id} locale={locale}>
                      {person.name}
                    </UserQuickProfileTooltip>
                    {person.planUsage ? <PlanUsageTag usage={person.planUsage} locale={locale} /> : null}
                    {person.approvalNote ? (
                      <span className="basis-full text-sm font-semibold text-[var(--warning-fg)]">{person.approvalNote}</span>
                    ) : null}
                  </span>
                  <PendingApprovalActions
                    locale={locale}
                    lessonId={lesson.id}
                    traineeId={person.id}
                    traineeName={person.name}
                    labels={{ confirm: lessonCreateLabels.confirmPendingCta, reject: lessonCreateLabels.rejectPendingCta }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {manage ? <div className="mt-3 w-fit">{manage}</div> : null}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function BookingsManager({
  locale,
  labels,
  lessonCreateLabels,
  lessons,
  days,
  initialDayKey,
  view,
  periodLabel,
  previousKey,
  nextKey,
  todayKey,
  pass,
  upcoming,
  canCreateStandaloneLesson,
  canUpdateTrainer,
  defaultTrainerId,
  trainerCandidates,
  lessonTypeCandidates,
  attendeeCandidates,
  openWeekdays,
  closedDates,
  isAdmin,
}: BookingsManagerProps) {
  const router = useRouter();
  const [isSwitching, startSwitch] = useTransition();
  const [selectedKey, setSelectedKey] = useState(initialDayKey);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [justStampedId, setJustStampedId] = useState<string | null>(null);

  const selectedDay = days.find((day) => day.key === selectedKey) ?? days[0];
  const dayLessons = lessons.filter((lesson) => lesson.dayKey === selectedDay.key);
  // A weekly/monthly pass follows the day being looked at (in the week view: today, or the week's first day).
  const focusKey = view === "WEEK" ? (days.find((day) => day.key === todayKey) ?? days[0]).key : selectedDay.key;
  const shownPass: BookingPass | null = (() => {
    if (!pass || (pass.kind !== "weekly" && pass.kind !== "monthly") || !pass.periods) return pass;
    const period = pass.periods.find((item) => focusKey >= item.startKey && focusKey < item.endKey);
    if (!period) return pass;
    return { ...pass, used: period.used, remaining: period.remaining, periodLabel: period.isCurrent ? null : period.label };
  })();
  const showPlanCost = pass && (pass.kind === "fixed" ? "fixed" : pass.kind === "weekly" || pass.kind === "monthly" ? "period" : null);
  const periodHasToday = days.some((day) => day.key === todayKey && (view !== "MONTH" || day.inMonth));
  const showUpcoming = upcoming.length > 0 || pass !== null;
  // Days without lessons are greyed; members cannot open them at all, staff still can to add a lesson there.
  const isDayLocked = (day: BookingsDay) => day.lessonCount === 0 && !canCreateStandaloneLesson;

  function selectDay(key: string) {
    setSelectedKey(key);
    setExpandedId(null);
    window.history.replaceState(null, "", bookingsHref(locale, key, view));
  }

  function switchView(next: BookingsViewValue) {
    if (next === view) return;
    startSwitch(async () => {
      await setBookingsViewAction(next);
      router.push(bookingsHref(locale, selectedDay.key, next), { scroll: false });
    });
  }

  function defaultStartsAt(dayKey: string) {
    const hour = dayKey === todayKey ? Math.min(23, getAppTimeParts(new Date()).hour + 1) : 8;
    return `${dayKey}T${String(hour).padStart(2, "0")}:00`;
  }

  function renderManage(lesson: BookingsLesson) {
    if (!lesson.canManageLesson) return null;
    return (
      <LessonManageButton
        locale={locale}
        lesson={lesson}
        labels={labels}
        lessonCreateLabels={lessonCreateLabels}
        canUpdateTrainer={canUpdateTrainer}
        isAdmin={isAdmin}
        trainerCandidates={trainerCandidates}
        lessonTypeCandidates={lessonTypeCandidates}
        attendeeCandidates={attendeeCandidates}
      />
    );
  }

  // The week view has no selected day: new lessons default to the first open day still ahead.
  const createDay = view === "WEEK" ? days.find((day) => !day.isPast && !day.isClosed) : selectedDay;
  const createLessonButton =
    canCreateStandaloneLesson && createDay && !createDay.isClosed && !createDay.isPast ? (
      <StandaloneLessonCreateDialog
        locale={locale}
        trainerCandidates={trainerCandidates}
        lessonTypeCandidates={lessonTypeCandidates}
        openWeekdays={openWeekdays}
        closedDates={closedDates}
        defaultTrainerId={defaultTrainerId}
        disableTrainerSelection={!canUpdateTrainer}
        defaultStartsAt={defaultStartsAt(createDay.key)}
        labels={{
          triggerCta: lessonCreateLabels.createStandaloneCta,
          title: lessonCreateLabels.standaloneTitle,
          description: lessonCreateLabels.standaloneDescription,
          trainerLabel: lessonCreateLabels.trainerLabel,
          standaloneDuration: lessonCreateLabels.standaloneDuration,
          standaloneMaxAttendees: lessonCreateLabels.standaloneMaxAttendees,
          standaloneCancellationWindow: lessonCreateLabels.standaloneCancellationWindow,
          standaloneLessonType: lessonCreateLabels.standaloneLessonType,
          lessonTitleLabel: lessonCreateLabels.lessonTitleLabel,
          lessonDescriptionLabel: lessonCreateLabels.lessonDescriptionLabel,
          startsAtLabel: labels.startsAtLabel,
          submitCta: lessonCreateLabels.createStandaloneCta,
          processing: labels.processing,
          closeCta: labels.closeCta,
        }}
        trigger={
          <Button variant="ghost" size="sm" className="h-11 gap-1.5 whitespace-nowrap px-3">
            <Plus size={18} aria-hidden="true" />
            {lessonCreateLabels.createStandaloneCta}
          </Button>
        }
      />
    ) : null;

  const todayLink = !periodHasToday ? (
    <Link
      href={bookingsHref(locale, todayKey, view)}
      className="inline-flex h-11 items-center rounded-xl px-3 text-[15px] font-semibold underline-offset-4 hover:underline"
    >
      {labels.today}
    </Link>
  ) : null;

  function lessonCountLabel(count: number) {
    return count === 1 ? labels.lessonsCountOne : fill(labels.lessonsCount, { n: count });
  }

  function dayAriaLabel(day: BookingsDay) {
    return [
      day.longLabel,
      day.isToday ? labels.today : null,
      day.isClosed ? labels.closedShort : lessonCountLabel(day.lessonCount),
      day.hasOwnBooking ? labels.stampBooked : null,
    ]
      .filter(Boolean)
      .join(", ");
  }

  function renderLessonList(items: BookingsLesson[], ariaLabel: string) {
    return (
      <ul aria-label={ariaLabel}>
        {items.map((lesson) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            locale={locale}
            labels={labels}
            lessonCreateLabels={lessonCreateLabels}
            expanded={expandedId === lesson.id}
            onToggle={() => setExpandedId((current) => (current === lesson.id ? null : lesson.id))}
            justStamped={justStampedId === lesson.id}
            onBooked={setJustStampedId}
            showPlanCost={showPlanCost ?? null}
            manage={renderManage(lesson)}
            dimmed={expandedId !== null && expandedId !== lesson.id}
          />
        ))}
      </ul>
    );
  }

  function renderUpcoming(headingId: string, className: string) {
    return (
      <aside aria-labelledby={headingId} className={className}>
        <h2 id={headingId} className="text-[17px] font-semibold">{labels.upcomingTitle}</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{labels.upcomingEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {upcoming.map((item) => (
              <li key={item.id}>
                <Link
                  href={bookingsHref(locale, item.dayKey, view)}
                  onClick={(event) => {
                    if (!days.some((day) => day.key === item.dayKey)) return;
                    event.preventDefault();
                    if (view !== "WEEK") selectDay(item.dayKey);
                    setExpandedId(item.id);
                    window.requestAnimationFrame(() =>
                      document.getElementById(`lesson-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                    );
                  }}
                  className="-mx-2 flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--muted)]"
                >
                  {item.lessonTypeIcon ? (
                    <LessonTypeIcon iconPath={item.lessonTypeIcon} colorHex={item.lessonTypeColor} size={18} />
                  ) : (
                    <span aria-hidden="true" className="h-[18px] w-[18px]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{item.title}</span>
                    <span className="tabular block text-sm text-[var(--muted-foreground)] first-letter:uppercase">{item.whenLabel}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-lg border-2 border-[var(--stamp)] px-2 py-1 text-xs font-extrabold uppercase tracking-[0.06em] text-[var(--stamp)]",
                      item.isPending ? "border-dashed" : ""
                    )}
                  >
                    {item.isPending ? labels.stampPending : labels.stampBooked}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>
    );
  }

  /* --- Band navigation, one per view --- */

  const dayStrip = (
    <div className="-mx-4 flex items-center gap-1 px-1.5 pb-2 sm:-mx-6 sm:px-4 lg:mx-0 lg:px-0">
      <Link href={bookingsHref(locale, previousKey, view)} aria-label={labels.prevWeek} className={navArrowClass}>
        <ChevronLeft size={20} aria-hidden="true" />
      </Link>
      <div role="group" aria-label={labels.weekNavigationLabel} className="grid flex-1 grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day) => {
          const selected = day.key === selectedDay.key;
          const empty = day.lessonCount === 0;
          const locked = isDayLocked(day) && !selected;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => selectDay(day.key)}
              disabled={locked}
              aria-pressed={selected}
              aria-label={dayAriaLabel(day)}
              className={cn(
                "relative flex min-h-[3.75rem] flex-col items-center justify-center rounded-xl transition-colors",
                selected
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : empty
                    ? "text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent"
                    : day.isPast
                      ? "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                      : "hover:bg-[var(--muted)]"
              )}
            >
              <span className={cn("text-xs font-semibold uppercase", selected ? "opacity-80" : "text-[var(--muted-foreground)]")}>
                {day.weekdayLabel}
              </span>
              <span
                className={cn(
                  "tabular text-xl leading-tight",
                  empty && !selected ? "font-medium" : "font-bold",
                  day.isToday && !selected ? "underline decoration-2 underline-offset-4" : ""
                )}
              >
                {day.dayNumberLabel}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "absolute bottom-1.5 h-1.5 w-1.5 rounded-full",
                  day.hasOwnBooking ? (selected ? "bg-[var(--primary-foreground)]" : "bg-[var(--stamp)]") : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
      <Link href={bookingsHref(locale, nextKey, view)} aria-label={labels.nextWeek} className={navArrowClass}>
        <ChevronRight size={20} aria-hidden="true" />
      </Link>
    </div>
  );

  const periodNav = (prevLabel: string, nextLabel: string) => (
    <div className="-mx-1.5 flex items-center gap-1 sm:mx-0">
      <Link href={bookingsHref(locale, previousKey, view)} aria-label={prevLabel} className={navArrowClass}>
        <ChevronLeft size={20} aria-hidden="true" />
      </Link>
      <h2 className="tabular flex-1 text-center text-[17px] font-semibold first-letter:uppercase">{periodLabel}</h2>
      <Link href={bookingsHref(locale, nextKey, view)} aria-label={nextLabel} className={navArrowClass}>
        <ChevronRight size={20} aria-hidden="true" />
      </Link>
    </div>
  );

  // Weekday initials for the month grid header come from the first grid row (always Monday first).
  const monthGrid = (
    <div className="pb-3">
      {periodNav(labels.prevMonth, labels.nextMonth)}
      <div aria-hidden="true" className="mt-2 grid grid-cols-7 gap-0.5 text-center text-xs font-semibold uppercase text-[var(--muted-foreground)] sm:gap-1">
        {days.slice(0, 7).map((day) => (
          <span key={day.key}>{day.weekdayLabel}</span>
        ))}
      </div>
      <div role="group" aria-label={fill(labels.monthGridLabel, { month: periodLabel })} className="mt-1 grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day) => {
          const selected = day.key === selectedDay.key;
          const empty = day.lessonCount === 0;
          const locked = isDayLocked(day) && !selected;
          // Up to three dots: solid violet for the user's own bookings first, pale for the other lessons.
          const dots = Math.min(3, day.lessonCount);
          const ownDots = Math.min(dots, day.ownBookingCount);
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => selectDay(day.key)}
              disabled={locked}
              aria-pressed={selected}
              aria-label={dayAriaLabel(day)}
              className={cn(
                "relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors sm:min-h-14",
                selected
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : empty || day.isPast
                    ? "text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent"
                    : "hover:bg-[var(--muted)]",
                !day.inMonth && !selected ? "opacity-45" : ""
              )}
            >
              <span
                className={cn(
                  "tabular text-[17px] leading-none",
                  empty && !selected ? "font-medium" : "font-bold",
                  day.isClosed && !selected ? "line-through decoration-1" : "",
                  day.isToday && !selected ? "underline decoration-2 underline-offset-4" : ""
                )}
              >
                {day.dayNumberLabel}
              </span>
              <span aria-hidden="true" className="flex h-1.5 items-center gap-0.5">
                {Array.from({ length: dots }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      selected
                        ? index < ownDots
                          ? "bg-[var(--primary-foreground)]"
                          : "bg-[var(--primary-foreground)] opacity-40"
                        : index < ownDots
                          ? "bg-[var(--stamp)]"
                          : "bg-[var(--muted-foreground)] opacity-35"
                    )}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const bandNav = view === "MONTH" ? monthGrid : view === "WEEK" ? <div className="pb-3">{periodNav(labels.prevWeek, labels.nextWeek)}</div> : dayStrip;

  /* --- Lessons under the band --- */

  const selectedDaySection = (
    <section aria-labelledby="day-heading" className="-mx-4 min-w-0 sm:-mx-6 lg:mx-0">
      <div className="flex min-h-14 items-center justify-between gap-2 px-4 pt-3 sm:px-6 lg:px-5">
        <h2 id="day-heading" className="text-[17px] font-semibold first-letter:uppercase">
          {selectedDay.longLabel}
        </h2>
        <div className="flex items-center gap-1">
          {todayLink}
          {createLessonButton}
        </div>
      </div>
      {dayLessons.length > 0 ? (
        renderLessonList(dayLessons, fill(labels.dayLessons, { day: selectedDay.longLabel }))
      ) : (
        <p className="px-4 pb-8 pt-4 text-[15px] text-[var(--muted-foreground)] sm:px-6 lg:px-5">
          {selectedDay.isClosed ? labels.closedDay : labels.noLessonsDay}
        </p>
      )}
    </section>
  );

  const weekSection = (
    <section aria-label={periodLabel} className="-mx-4 min-w-0 sm:-mx-6 lg:mx-0">
      {todayLink || createLessonButton ? (
        <div className="flex min-h-14 items-center justify-end gap-1 px-4 pt-3 sm:px-6 lg:px-5">
          {todayLink}
          {createLessonButton}
        </div>
      ) : null}
      {lessons.length === 0 ? (
        <p className="px-4 pb-8 pt-4 text-[15px] text-[var(--muted-foreground)] sm:px-6 lg:px-5">{labels.noLessonsWeek}</p>
      ) : (
        days.map((day) => {
          const items = lessons.filter((lesson) => lesson.dayKey === day.key);
          const headingId = `week-day-${day.key}`;
          if (items.length === 0) {
            // Empty days collapse to one greyed line, so the week still reads Monday to Sunday.
            return (
              <p
                key={day.key}
                className="flex min-h-11 items-center gap-2 border-b border-[var(--rule)] px-4 text-[15px] text-[var(--muted-foreground)] sm:px-6 lg:px-5"
              >
                <span className="font-semibold first-letter:uppercase">{day.longLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{day.isClosed ? labels.closedShort : labels.noLessonsShort}</span>
              </p>
            );
          }
          return (
            <section key={day.key} aria-labelledby={headingId} className="border-b border-[var(--rule)] last:border-b-0">
              <h3 id={headingId} className="flex items-center gap-2 px-4 pb-1 pt-5 text-[17px] font-semibold sm:px-6 lg:px-5">
                <span className="first-letter:uppercase">{day.longLabel}</span>
                {day.isToday ? (
                  <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-sm font-semibold">{labels.today}</span>
                ) : null}
              </h3>
              {renderLessonList(items, fill(labels.dayLessons, { day: day.longLabel }))}
            </section>
          );
        })
      )}
    </section>
  );

  const columns = showUpcoming ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : "max-w-4xl";

  return (
    <div>
      {/* The page owns its stock band: title, pass and calendar navigation sit on the section card stock,
          and the band ends exactly on the navigation's edge, never across a line of text. */}
      <div
        data-page-band
        className="-mt-4 bg-[var(--stock)] pt-1 shadow-[0_0_0_100vmax_var(--stock)] [clip-path:inset(0_-100vmax)] lg:-mt-10 lg:pt-10"
      >
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-[1.375rem] font-bold leading-tight lg:text-[2rem]">{labels.title}</h1>
            <p className="mt-1 hidden text-[15px] text-[var(--stock-ink)]/75 lg:block">{labels.description}</p>
          </div>
          <SegmentedTabs<BookingsViewValue>
            label={labels.viewLabel}
            value={view}
            onChange={switchView}
            options={[
              ["DAY", labels.viewDay],
              ["WEEK", labels.viewWeek],
              ["MONTH", labels.viewMonth],
            ]}
            className={cn("bg-[var(--surface)]/60 transition-opacity", isSwitching ? "opacity-60" : "")}
          />
        </header>
        <div className={cn("mt-5 grid gap-5 lg:gap-8", columns)}>
          <div className="min-w-0 space-y-4">
            {shownPass ? <PassCard pass={shownPass} labels={labels.pass} /> : null}
            {bandNav}
          </div>
          {showUpcoming ? renderUpcoming("upcoming-heading-desktop", "hidden pb-6 lg:block lg:pt-1") : null}
        </div>
      </div>

      {/* Rows lie directly on the section paper; the pass is the page's only card. */}
      <div className={cn("grid lg:gap-8", columns)}>{view === "WEEK" ? weekSection : selectedDaySection}</div>

      {showUpcoming ? renderUpcoming("upcoming-heading", "mt-6 border-t border-[var(--rule)] pt-5 lg:hidden") : null}
    </div>
  );
}
