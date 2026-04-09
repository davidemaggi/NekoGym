"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  addLessonAttendeeMutationAction,
  confirmLessonWaitlistEntryMutationAction,
  removeLessonWaitlistEntryMutationAction,
  removeLessonAttendeeMutationAction,
  updateLessonMainMutationAction,
  updateLessonTrainerMutationAction,
} from "./standalone-create-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CandidateOption = {
  id: string;
  name: string;
};

type AttendeeOption = {
  id: string;
  name: string;
  email?: string;
};

type LessonManageDialogProps = {
  locale: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
    updateStandaloneCta: string;
    updateTrainerCta: string;
    attendeesLabel: string;
    noAttendees: string;
    attendeeSelectLabel: string;
    addAttendeeCta: string;
    removeAttendeeCta: string;
    waitlistLabel: string;
    noWaitlist: string;
    confirmWaitlistCta: string;
    removeWaitlistCta: string;
    processing: string;
    closeCta: string;
  };
  lesson: {
    id: string;
    canEditMain: boolean;
    startsAt: string;
    durationMinutes: number;
    maxAttendees: number;
    cancellationWindowHours: number;
    trainerId: string;
    lessonTypeId: string;
    canManageTrainer: boolean;
    attendees: AttendeeOption[];
    waitlist: AttendeeOption[];
  };
  trainerCandidates: CandidateOption[];
  lessonTypeCandidates: CandidateOption[];
  attendeeCandidates: AttendeeOption[];
};

type ActiveTab = "main" | "people";
const ACTIVE_TAB_STORAGE_KEY = "neko.lesson-manage.active-tab.v1";

function isActiveTab(value: string): value is ActiveTab {
  return value === "main" || value === "people";
}

export function LessonManageDialog({
  locale,
  trigger,
  open,
  onOpenChange,
  labels,
  lesson,
  trainerCandidates,
  lessonTypeCandidates,
  attendeeCandidates,
}: LessonManageDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [attendeeToAdd, setAttendeeToAdd] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("main");
  const [hasLoadedStoredTab, setHasLoadedStoredTab] = useState(false);
  const router = useRouter();
  const isControlled = typeof open === "boolean";
  const resolvedOpen = isControlled ? open : internalOpen;
  const resolvedTab: ActiveTab = lesson.canEditMain ? activeTab : "people";

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
    onOpenChange?.(next);
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

  return (
    <Dialog open={resolvedOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        {lesson.canEditMain ? (
          <div className="inline-flex rounded-md border border-[var(--surface-border)] p-1">
            <button
              type="button"
              onClick={() => setTabAndPersist("main")}
              className={[
                "rounded px-3 py-1.5 text-xs font-medium",
                resolvedTab === "main"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
              ].join(" ")}
            >
              {labels.tabMain}
            </button>
            <button
              type="button"
              onClick={() => setTabAndPersist("people")}
              className={[
                "rounded px-3 py-1.5 text-xs font-medium",
                resolvedTab === "people"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
              ].join(" ")}
            >
              {labels.tabPeople}
            </button>
          </div>
        ) : null}

        {resolvedTab === "main" && lesson.canEditMain ? (
          <form action={handleMainSubmit} className="space-y-3 rounded-md border border-[var(--surface-border)] p-3">
            <div className="space-y-1">
              <Label htmlFor={`startsAt-${lesson.id}`}>{labels.startsAtLabel}</Label>
              <Input id={`startsAt-${lesson.id}`} type="datetime-local" name="startsAt" defaultValue={lesson.startsAt} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor={`duration-${lesson.id}`}>{labels.standaloneDuration}</Label>
                <Input id={`duration-${lesson.id}`} type="number" name="durationMinutes" min={1} defaultValue={lesson.durationMinutes} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`maxAttendees-${lesson.id}`}>{labels.standaloneMaxAttendees}</Label>
                <Input id={`maxAttendees-${lesson.id}`} type="number" name="maxAttendees" min={1} defaultValue={lesson.maxAttendees} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`cancelWindow-${lesson.id}`}>{labels.standaloneCancellationWindow}</Label>
              <Input
                id={`cancelWindow-${lesson.id}`}
                type="number"
                name="cancellationWindowHours"
                min={1}
                defaultValue={lesson.cancellationWindowHours}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor={`lessonType-${lesson.id}`}>{labels.standaloneLessonType}</Label>
                <select
                  id={`lessonType-${lesson.id}`}
                  name="lessonTypeId"
                  defaultValue={lesson.lessonTypeId}
                  className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
                >
                  <option value="">- {labels.standaloneLessonType} -</option>
                  {lessonTypeCandidates.map((type) => (
                    <option key={`manage-standalone-type-${type.id}`} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? labels.processing : labels.updateStandaloneCta}
            </Button>
          </form>
        ) : null}

        {resolvedTab === "people" ? (
          <div className="space-y-3">
            {lesson.canManageTrainer ? (
              <div className="space-y-1 rounded-md border border-[var(--surface-border)] p-3">
                <Label htmlFor={`trainer-update-${lesson.id}`}>{labels.trainerLabel}</Label>
                <div className="flex items-center gap-2">
                  <select
                    id={`trainer-update-${lesson.id}`}
                    defaultValue={lesson.trainerId}
                    className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
                    onChange={(event) => handleTrainerUpdate(event.target.value)}
                    disabled={isPending}
                  >
                    <option value="">- {labels.trainerLabel} -</option>
                    {trainerCandidates.map((trainer) => (
                      <option key={`manage-trainer-${trainer.id}`} value={trainer.id}>
                        {trainer.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-[var(--muted-foreground)]">{labels.updateTrainerCta}</span>
                </div>
              </div>
            ) : null}

            <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
              <p className="text-sm font-semibold">{labels.attendeesLabel}</p>
              {lesson.attendees.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">{labels.noAttendees}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {lesson.attendees.map((attendee) => (
                    <button
                      key={`attendee-${lesson.id}-${attendee.id}`}
                      type="button"
                      onClick={() => handleRemoveAttendee(attendee.id)}
                      className="inline-flex items-center gap-1 rounded border border-[var(--surface-border)] px-2 py-1 text-xs hover:bg-[var(--muted)]"
                      disabled={isPending}
                      title={labels.removeAttendeeCta}
                    >
                      <span>{attendee.name}</span>
                      <span className="text-red-600 dark:text-red-300">x</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <select
                  value={attendeeToAdd}
                  onChange={(event) => setAttendeeToAdd(event.target.value)}
                  className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
                  disabled={isPending}
                >
                  <option value="">- {labels.attendeeSelectLabel} -</option>
                  {attendeeCandidates.map((candidate) => (
                    <option key={`candidate-${lesson.id}-${candidate.id}`} value={candidate.id}>
                      {candidate.name}{candidate.email ? ` (${candidate.email})` : ""}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="outline" onClick={handleAddAttendee} disabled={isPending || !attendeeToAdd}>
                  {labels.addAttendeeCta}
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
              <p className="text-sm font-semibold">{labels.waitlistLabel}</p>
              {lesson.waitlist.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">{labels.noWaitlist}</p>
              ) : (
                <div className="space-y-2">
                  {lesson.waitlist.map((queuedUser) => (
                    <div key={`waitlist-${lesson.id}-${queuedUser.id}`} className="flex items-center justify-between gap-2 rounded border border-[var(--surface-border)] px-2 py-1 text-xs">
                      <span className="truncate">
                        {queuedUser.name}{queuedUser.email ? ` (${queuedUser.email})` : ""}
                      </span>
                      <div className="inline-flex items-center gap-1">
                        <Button type="button" size="sm" variant="outline" onClick={() => handleConfirmWaitlist(queuedUser.id)} disabled={isPending}>
                          {labels.confirmWaitlistCta}
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveWaitlist(queuedUser.id)} disabled={isPending}>
                          {labels.removeWaitlistCta}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
            {labels.closeCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

