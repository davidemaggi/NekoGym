"use client";

import { type ReactNode, useState, useTransition } from "react";
import { Check, MoreHorizontal, Pencil, Send, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  addLessonAttendeeMutationAction,
  broadcastLessonNotificationMutationAction,
  confirmLessonWaitlistEntryMutationAction,
  removeLessonWaitlistEntryMutationAction,
  removeLessonAttendeeMutationAction,
  setLessonAttendeeAttendanceMutationAction,
  updateLessonMainMutationAction,
  updateLessonTrainerMutationAction,
} from "./standalone-create-action";
import { confirmLessonBookingAction, rejectLessonBookingAction } from "@/app/[locale]/(app)/bookings/actions";
import { SegmentedTabs, StatusNote } from "@/components/settings/settings-ui";
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
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlanUsageTag } from "@/components/users/plan-usage-tag";
import { UserQuickProfileTooltip } from "@/components/users/user-quick-profile-tooltip";
import { weekdayOfDateKey } from "@/lib/date-time";
import type { PlanUsage } from "@/lib/plan-usage";

type CandidateOption = {
  id: string;
  name: string;
};

type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
const WEEKDAY_BY_INDEX: Weekday[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DEFAULT_OPEN_WEEKDAYS: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

type AttendeeOption = {
  id: string;
  name: string;
  email?: string;
  planUsage?: PlanUsage;
};

type LessonManageDialogProps = {
  locale: string;
  showDefaultTrigger?: boolean;
  iconOnlyTrigger?: boolean;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChangeAction?: (open: boolean) => void;
  labels: {
    title: string;
    description: string;
    tabMain: string;
    tabPeople: string;
    startsAtLabel: string;
    trainerLabel: string;
    standaloneDuration: string;
    standaloneMaxAttendees: string;
    standaloneCancellationWindow: string;
    standaloneLessonType: string;
    lessonTitleLabel: string;
    lessonDescriptionLabel: string;
    updateStandaloneCta: string;
    updateTrainerCta: string;
    attendeesLabel: string;
    noAttendees: string;
    attendeeSelectLabel: string;
    addAttendeeCta: string;
    removeAttendeeCta: string;
    markAttendancePresentCta: string;
    markAttendanceNoShowCta: string;
    attendanceStatusLabel: string;
    attendanceStatusPresent: string;
    attendanceStatusNoShow: string;
    attendanceStatusUnmarked: string;
    pendingApprovalsLabel: string;
    noPendingApprovals: string;
    confirmPendingCta: string;
    confirmPendingAndGrantAccessCta: string;
    rejectPendingCta: string;
    waitlistLabel: string;
    noWaitlist: string;
    confirmWaitlistCta: string;
    removeWaitlistCta: string;
    processing: string;
    closeCta: string;
    manageTriggerLabel: string;
    notifySectionTitle: string;
    notifyMessageLabel: string;
    notifyMessagePlaceholder: string;
    notifySendCta: string;
  };
  lesson: {
    id: string;
    canEditMain: boolean;
    title: string;
    description: string;
    startsAt: string;
    durationMinutes: number;
    maxAttendees: number;
    cancellationWindowHours: number;
    trainerId: string;
    lessonTypeId: string;
    canManageTrainer: boolean;
    canManageAttendance: boolean;
    attendees: AttendeeOption[];
    attendeeAttendance: Record<string, "PRESENT" | "NO_SHOW" | null>;
    pendingApprovals: AttendeeOption[];
    waitlist: AttendeeOption[];
  };
  trainerCandidates: CandidateOption[];
  lessonTypeCandidates: CandidateOption[];
  attendeeCandidates: AttendeeOption[];
  openWeekdays?: Weekday[];
  closedDates?: string[];
  allowPeopleActions?: boolean;
  canBroadcastToAttendees?: boolean;
  canGrantOpenAccess?: boolean;
};

type ActiveTab = "main" | "people";
const ACTIVE_TAB_STORAGE_KEY = "neko.lesson-manage.active-tab.v1";

function isActiveTab(value: string): value is ActiveTab {
  return value === "main" || value === "people";
}

export function LessonManageDialog({
  locale,
  showDefaultTrigger = true,
  iconOnlyTrigger = false,
  trigger,
  open,
  onOpenChangeAction,
  labels,
  lesson,
  trainerCandidates,
  lessonTypeCandidates,
  attendeeCandidates,
  openWeekdays,
  closedDates,
  allowPeopleActions = true,
  canBroadcastToAttendees = false,
  canGrantOpenAccess = false,
}: LessonManageDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmRemove, setConfirmRemove] = useState<{ kind: "attendee" | "queue"; id: string; name: string } | null>(null);
  const [attendeeToAdd, setAttendeeToAdd] = useState("");
  const [trainerDraft, setTrainerDraft] = useState(lesson.trainerId);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("main");
  const [hasLoadedStoredTab, setHasLoadedStoredTab] = useState(false);
  const router = useRouter();
  const isControlled = typeof open === "boolean";
  const resolvedOpen = isControlled ? open : internalOpen;
  const resolvedTab: ActiveTab = lesson.canEditMain ? activeTab : "people";
  const openWeekdaySet = new Set<Weekday>((openWeekdays && openWeekdays.length > 0) ? openWeekdays : DEFAULT_OPEN_WEEKDAYS);
  const closedDateSet = new Set(closedDates ?? []);

  function validateScheduleDate(input: HTMLInputElement): boolean {
    const raw = input.value;
    if (!raw) {
      input.setCustomValidity("");
      return true;
    }

    // The input holds a wall-clock date: read it as written, never through the device's zone.
    const dateKey = raw.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      input.setCustomValidity("");
      return true;
    }

    const weekday = WEEKDAY_BY_INDEX[weekdayOfDateKey(dateKey)];
    const isClosed = !openWeekdaySet.has(weekday) || closedDateSet.has(dateKey);
    if (isClosed) {
      input.setCustomValidity(
        locale === "it"
          ? "Giorno di chiusura palestra: scegli una data di apertura."
          : "Gym is closed on this date. Please choose an open date."
      );
      return false;
    }

    input.setCustomValidity("");
    return true;
  }

  function setDialogOpen(next: boolean) {
    if (next && !lesson.canEditMain) {
      setActiveTab("people");
    }

    if (next && !hasLoadedStoredTab) {
      if (lesson.canEditMain) {
        try {
          const stored = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
          if (stored && isActiveTab(stored)) {
            setActiveTab(stored);
          }
        } catch {
          // Ignore storage read failures.
        }
      }
      setHasLoadedStoredTab(true);
    }

    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChangeAction?.(next);
  }

  function setTabAndPersist(tab: ActiveTab) {
    setActiveTab(tab);

    try {
      window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    } catch {
      // Ignore storage failures (private mode / disabled storage).
    }
  }

  function handleMainSubmit(formData: FormData) {
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);

    startTransition(async () => {
      const result = await updateLessonMainMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleTrainerUpdate(trainerId: string) {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    formData.set("trainerId", trainerId);

    startTransition(async () => {
      const result = await updateLessonTrainerMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleAddAttendee() {
    if (!attendeeToAdd) return;

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    formData.set("attendeeId", attendeeToAdd);

    startTransition(async () => {
      const result = await addLessonAttendeeMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setAttendeeToAdd("");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleRemoveAttendee(attendeeId: string) {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    formData.set("attendeeId", attendeeId);

    startTransition(async () => {
      const result = await removeLessonAttendeeMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleSetAttendance(attendeeId: string, attendanceStatus: "PRESENT" | "NO_SHOW") {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    formData.set("attendeeId", attendeeId);
    formData.set("attendanceStatus", attendanceStatus);

    startTransition(async () => {
      const result = await setLessonAttendeeAttendanceMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleConfirmWaitlist(attendeeId: string) {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    formData.set("attendeeId", attendeeId);

    startTransition(async () => {
      const result = await confirmLessonWaitlistEntryMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleRemoveWaitlist(attendeeId: string) {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    formData.set("attendeeId", attendeeId);

    startTransition(async () => {
      const result = await removeLessonWaitlistEntryMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleConfirmPending(attendeeId: string, grantOpenAccess: boolean) {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    formData.set("traineeId", attendeeId);
    if (grantOpenAccess) formData.set("grantOpenAccess", "1");

    startTransition(async () => {
      const result = await confirmLessonBookingAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleRejectPending(attendeeId: string) {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    formData.set("traineeId", attendeeId);

    startTransition(async () => {
      const result = await rejectLessonBookingAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleBroadcastToAttendees() {
    if (!broadcastMessage.trim()) return;

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    formData.set("message", broadcastMessage.trim());

    startTransition(async () => {
      const result = await broadcastLessonNotificationMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setBroadcastMessage("");
      } else {
        toast.error(result.message);
      }
    });
  }

  const isIt = locale === "it";
  const local = {
    moreFor: (name: string) => (isIt ? `Altre azioni per ${name}` : `More actions for ${name}`),
    removeAttendeeTitle: isIt ? "Rimuovere dalla lezione?" : "Remove from the lesson?",
    removeAttendeeBody: (name: string) =>
      isIt
        ? `${name} viene tolto dalla lezione e riceve una notifica. Se ha un pacchetto, la lezione gli viene restituita.`
        : `${name} is removed from the lesson and notified. A pack lesson is given back.`,
    removeQueueTitle: isIt ? "Togliere dalla coda?" : "Remove from the queue?",
    removeQueueBody: (name: string) => (isIt ? `${name} non sarà più in coda per questa lezione.` : `${name} will no longer be queued for this lesson.`),
    removeAttendeeConfirm: isIt ? "Rimuovi dalla lezione" : "Remove from lesson",
    cancel: isIt ? "Annulla" : "Cancel",
    queuePosition: (n: number) => (isIt ? `${n}° in coda` : `#${n} in queue`),
  };
  const attendanceTone = (status: "PRESENT" | "NO_SHOW" | null | undefined) =>
    status === "PRESENT" ? "ok" : status === "NO_SHOW" ? "warn" : "neutral";

  function sectionTitle(title: string, count?: number) {
    return (
      <h3 className="flex items-baseline justify-between text-[17px] font-semibold">
        {title}
        {count !== undefined ? <span className="tabular text-sm font-medium text-[var(--muted-foreground)]">{count}</span> : null}
      </h3>
    );
  }

  function personName(person: { id: string; name: string; planUsage?: PlanUsage }) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="min-w-0 text-[16px] font-semibold">
          <UserQuickProfileTooltip userId={person.id} locale={locale}>
            {person.name}
          </UserQuickProfileTooltip>
        </span>
        {person.planUsage ? <PlanUsageTag usage={person.planUsage} locale={locale} /> : null}
      </div>
    );
  }

  function moreMenu(name: string, label: string, onSelect: () => void) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={local.moreFor(name)}
            disabled={isPending}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-[var(--danger-fg)]" onSelect={onSelect}>
            {label}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog open={resolvedOpen} onOpenChange={setDialogOpen}>
      {showDefaultTrigger ? (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={iconOnlyTrigger ? "w-11 px-0" : undefined}
            aria-label={labels.manageTriggerLabel}
          >
            <Pencil size={16} aria-hidden="true" />
            {!iconOnlyTrigger ? labels.manageTriggerLabel : null}
          </Button>
        </DialogTrigger>
      ) : trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        {lesson.canEditMain ? (
          <SegmentedTabs
            className="grid w-full grid-cols-2"
            value={resolvedTab}
            onChange={setTabAndPersist}
            options={[
              ["main", labels.tabMain],
              ["people", labels.tabPeople],
            ]}
          />
        ) : null}

        {resolvedTab === "main" && lesson.canEditMain ? (
          <form action={handleMainSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor={`lessonTitle-${lesson.id}`}>{labels.lessonTitleLabel}</Label>
              <Input id={`lessonTitle-${lesson.id}`} name="title" defaultValue={lesson.title} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`lessonDescription-${lesson.id}`}>{labels.lessonDescriptionLabel}</Label>
              <Textarea id={`lessonDescription-${lesson.id}`} name="description" defaultValue={lesson.description} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`startsAt-${lesson.id}`}>{labels.startsAtLabel}</Label>
              <Input
                id={`startsAt-${lesson.id}`}
                type="datetime-local"
                name="startsAt"
                className="tabular"
                defaultValue={lesson.startsAt}
                required
                onChange={(event) => validateScheduleDate(event.currentTarget)}
                onInvalid={(event) => validateScheduleDate(event.currentTarget)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor={`duration-${lesson.id}`}>{labels.standaloneDuration}</Label>
                <Input id={`duration-${lesson.id}`} type="number" inputMode="numeric" className="tabular" name="durationMinutes" min={1} defaultValue={lesson.durationMinutes} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`maxAttendees-${lesson.id}`}>{labels.standaloneMaxAttendees}</Label>
                <Input id={`maxAttendees-${lesson.id}`} type="number" inputMode="numeric" className="tabular" name="maxAttendees" min={1} defaultValue={lesson.maxAttendees} required />
              </div>
              <div className="col-span-2 space-y-1.5 sm:col-span-1">
                <Label htmlFor={`cancelWindow-${lesson.id}`}>{labels.standaloneCancellationWindow}</Label>
                <Input
                  id={`cancelWindow-${lesson.id}`}
                  type="number"
                  inputMode="numeric"
                  className="tabular"
                  name="cancellationWindowHours"
                  min={1}
                  defaultValue={lesson.cancellationWindowHours}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`lessonType-${lesson.id}`}>{labels.standaloneLessonType}</Label>
              <select id={`lessonType-${lesson.id}`} name="lessonTypeId" defaultValue={lesson.lessonTypeId} className="ui-select w-full">
                <option value="">— {labels.standaloneLessonType} —</option>
                {lessonTypeCandidates.map((type) => (
                  <option key={`manage-standalone-type-${type.id}`} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? labels.processing : labels.updateStandaloneCta}
            </Button>
          </form>
        ) : null}

        {resolvedTab === "people" ? (
          <div className={lesson.canEditMain ? "pt-2" : undefined}>
            {lesson.canManageTrainer && allowPeopleActions ? (
              <section className="space-y-1.5 pb-5">
                <Label htmlFor={`trainer-update-${lesson.id}`}>{labels.trainerLabel}</Label>
                {/* An explicit save: changing the trainer notifies people, so a stray pick must not send it. */}
                <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  id={`trainer-update-${lesson.id}`}
                  value={trainerDraft}
                  className="ui-select w-full min-w-0"
                  onChange={(event) => setTrainerDraft(event.target.value)}
                  disabled={isPending}
                >
                  <option value="">— {labels.trainerLabel} —</option>
                  {trainerCandidates.map((trainer) => (
                    <option key={`manage-trainer-${trainer.id}`} value={trainer.id}>
                      {trainer.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={isPending || trainerDraft === lesson.trainerId}
                  onClick={() => handleTrainerUpdate(trainerDraft)}
                >
                  {labels.updateTrainerCta}
                </Button>
                </div>
              </section>
            ) : null}

            <section className="border-t border-[var(--rule)] py-5 first:border-t-0 first:pt-0">
              {sectionTitle(labels.attendeesLabel, lesson.attendees.length)}
              {lesson.attendees.length === 0 ? (
                <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{labels.noAttendees}</p>
              ) : (
                <ul className="mt-2 divide-y divide-[var(--rule)]">
                  {lesson.attendees.map((attendee) => {
                    const attendance = lesson.attendeeAttendance[attendee.id];
                    return (
                      <li key={`attendee-${lesson.id}-${attendee.id}`} className="space-y-2 py-3">
                        <div className="flex items-center justify-between gap-2">
                          {personName(attendee)}
                          {allowPeopleActions ? moreMenu(attendee.name, labels.removeAttendeeCta, () => setConfirmRemove({ kind: "attendee", id: attendee.id, name: attendee.name })) : null}
                        </div>
                        {lesson.canManageAttendance && allowPeopleActions ? (
                          <div role="group" aria-label={`${labels.attendanceStatusLabel}: ${attendee.name}`} className="grid grid-cols-2 gap-0.5 rounded-xl bg-[var(--muted)] p-1 sm:max-w-xs">
                            {(
                              [
                                ["PRESENT", labels.markAttendancePresentCta],
                                ["NO_SHOW", labels.markAttendanceNoShowCta],
                              ] as const
                            ).map(([value, text]) => (
                              <button
                                key={value}
                                type="button"
                                aria-pressed={attendance === value}
                                disabled={isPending}
                                onClick={() => handleSetAttendance(attendee.id, value)}
                                className={cn(
                                  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-[15px] font-semibold transition-colors",
                                  attendance === value
                                    ? value === "PRESENT"
                                      ? "bg-[var(--success-bg)] text-[var(--success-fg)] shadow-[var(--shadow-lift)]"
                                      : "bg-[var(--warning-bg)] text-[var(--warning-fg)] shadow-[var(--shadow-lift)]"
                                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                )}
                              >
                                {attendance === value ? <Check size={16} aria-hidden="true" /> : null}
                                {text}
                              </button>
                            ))}
                          </div>
                        ) : attendance ? (
                          <StatusNote tone={attendanceTone(attendance)}>
                            {attendance === "PRESENT" ? labels.attendanceStatusPresent : labels.attendanceStatusNoShow}
                          </StatusNote>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}

              {allowPeopleActions ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <label htmlFor={`add-attendee-${lesson.id}`} className="sr-only">
                    {labels.attendeeSelectLabel}
                  </label>
                  <select
                    id={`add-attendee-${lesson.id}`}
                    value={attendeeToAdd}
                    onChange={(event) => setAttendeeToAdd(event.target.value)}
                    className="ui-select w-full min-w-0"
                    disabled={isPending}
                  >
                    <option value="">— {labels.attendeeSelectLabel} —</option>
                    {attendeeCandidates.map((candidate) => (
                      <option key={`candidate-${lesson.id}-${candidate.id}`} value={candidate.id}>
                        {candidate.name}
                        {candidate.email ? ` (${candidate.email})` : ""}
                      </option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" className="shrink-0" onClick={handleAddAttendee} disabled={isPending || !attendeeToAdd}>
                    <UserPlus size={16} aria-hidden="true" />
                    {labels.addAttendeeCta}
                  </Button>
                </div>
              ) : null}
            </section>

            <section className="border-t border-[var(--rule)] py-5">
              {sectionTitle(labels.pendingApprovalsLabel, lesson.pendingApprovals.length)}
              {lesson.pendingApprovals.length === 0 ? (
                <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{labels.noPendingApprovals}</p>
              ) : (
                <ul className="mt-2 divide-y divide-[var(--rule)]">
                  {lesson.pendingApprovals.map((pendingUser) => (
                    <li key={`pending-${lesson.id}-${pendingUser.id}`} className="space-y-2 py-3">
                      {personName(pendingUser)}
                      {allowPeopleActions ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button type="button" onClick={() => handleConfirmPending(pendingUser.id, false)} disabled={isPending}>
                            {labels.confirmPendingCta}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => handleRejectPending(pendingUser.id)} disabled={isPending}>
                            {labels.rejectPendingCta}
                          </Button>
                          {canGrantOpenAccess ? (
                            <button
                              type="button"
                              className="inline-flex min-h-11 basis-full items-center text-[15px] font-semibold underline decoration-[1.5px] underline-offset-4 hover:decoration-2 disabled:opacity-45 sm:basis-auto"
                              onClick={() => handleConfirmPending(pendingUser.id, true)}
                              disabled={isPending}
                            >
                              {labels.confirmPendingAndGrantAccessCta}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="border-t border-[var(--rule)] py-5">
              {sectionTitle(labels.waitlistLabel, lesson.waitlist.length)}
              {lesson.waitlist.length === 0 ? (
                <p className="mt-2 text-[15px] text-[var(--muted-foreground)]">{labels.noWaitlist}</p>
              ) : (
                <ol className="mt-2 divide-y divide-[var(--rule)]">
                  {lesson.waitlist.map((queuedUser, index) => (
                    <li key={`waitlist-${lesson.id}-${queuedUser.id}`} className="flex items-center gap-3 py-3">
                      <span className="tabular w-8 shrink-0 text-[15px] font-semibold text-[var(--muted-foreground)]" aria-label={local.queuePosition(index + 1)}>
                        {index + 1}.
                      </span>
                      <div className="min-w-0 flex-1">{personName(queuedUser)}</div>
                      {allowPeopleActions ? (
                        <>
                          <Button type="button" variant="outline" className="shrink-0" onClick={() => handleConfirmWaitlist(queuedUser.id)} disabled={isPending}>
                            {labels.confirmWaitlistCta}
                          </Button>
                          {moreMenu(queuedUser.name, labels.removeWaitlistCta, () => setConfirmRemove({ kind: "queue", id: queuedUser.id, name: queuedUser.name }))}
                        </>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {canBroadcastToAttendees ? (
              <section className="space-y-3 border-t border-[var(--rule)] pt-5">
                {sectionTitle(labels.notifySectionTitle)}
                <div className="space-y-1.5">
                  <Label htmlFor={`broadcast-message-${lesson.id}`}>{labels.notifyMessageLabel}</Label>
                  <Textarea
                    id={`broadcast-message-${lesson.id}`}
                    value={broadcastMessage}
                    onChange={(event) => setBroadcastMessage(event.target.value)}
                    rows={3}
                    placeholder={labels.notifyMessagePlaceholder}
                    disabled={isPending}
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleBroadcastToAttendees} disabled={isPending || !broadcastMessage.trim()}>
                  <Send size={16} aria-hidden="true" />
                  {labels.notifySendCta}
                </Button>
              </section>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
            {labels.closeCta}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={Boolean(confirmRemove)} onOpenChange={(next) => !next && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmRemove?.kind === "queue" ? local.removeQueueTitle : local.removeAttendeeTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRemove
                ? confirmRemove.kind === "queue"
                  ? local.removeQueueBody(confirmRemove.name)
                  : local.removeAttendeeBody(confirmRemove.name)
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="ghost">
                {local.cancel}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  if (!confirmRemove) return;
                  if (confirmRemove.kind === "queue") handleRemoveWaitlist(confirmRemove.id);
                  else handleRemoveAttendee(confirmRemove.id);
                  setConfirmRemove(null);
                }}
              >
                {confirmRemove?.kind === "queue" ? labels.removeWaitlistCta : local.removeAttendeeConfirm}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
