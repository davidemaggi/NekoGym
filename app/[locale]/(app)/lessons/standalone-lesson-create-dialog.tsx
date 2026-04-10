"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createStandaloneLessonMutationAction, updateStandaloneLessonMutationAction } from "./standalone-create-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CandidateOption = {
  id: string;
  name: string;
};

type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
const WEEKDAY_BY_INDEX: Weekday[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DEFAULT_OPEN_WEEKDAYS: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

type StandaloneLessonDialogProps = {
  locale: string;
  labels: {
    triggerCta: string;
    title: string;
    description: string;
    startsAtLabel: string;
    trainerLabel: string;
    standaloneDuration: string;
    standaloneMaxAttendees: string;
    standaloneCancellationWindow: string;
    standaloneLessonType: string;
    lessonTitleLabel: string;
    lessonDescriptionLabel: string;
    submitCta: string;
    processing: string;
    closeCta: string;
  };
  trainerCandidates: CandidateOption[];
  lessonTypeCandidates: CandidateOption[];
  lessonId?: string;
  defaultTrainerId?: string;
  defaultStartsAt?: string;
  defaultDurationMinutes?: number;
  defaultMaxAttendees?: number;
  defaultCancellationWindowHours?: number;
  defaultLessonTypeId?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  trigger?: ReactNode;
  openWeekdays?: Weekday[];
  closedDates?: string[];
};

function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function StandaloneLessonCreateDialog({
  locale,
  labels,
  trainerCandidates,
  lessonTypeCandidates,
  lessonId,
  defaultTrainerId,
  defaultStartsAt,
  defaultDurationMinutes,
  defaultMaxAttendees,
  defaultCancellationWindowHours,
  defaultLessonTypeId,
  defaultTitle,
  defaultDescription,
  trigger,
  openWeekdays,
  closedDates,
}: StandaloneLessonDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const startsAtDefault = useMemo(() => {
    if (defaultStartsAt) return defaultStartsAt;
    const nextHour = new Date();
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(nextHour.getHours() + 1);
    return toDateTimeLocalValue(nextHour);
  }, [defaultStartsAt]);
  const openWeekdaySet = useMemo(
    () => new Set<Weekday>((openWeekdays && openWeekdays.length > 0) ? openWeekdays : DEFAULT_OPEN_WEEKDAYS),
    [openWeekdays]
  );
  const closedDateSet = useMemo(() => new Set(closedDates ?? []), [closedDates]);

  function validateScheduleDate(input: HTMLInputElement): boolean {
    const raw = input.value;
    if (!raw) {
      input.setCustomValidity("");
      return true;
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      input.setCustomValidity("");
      return true;
    }

    const weekday = WEEKDAY_BY_INDEX[date.getDay()];
    const dateKey = toDateTimeLocalValue(date).slice(0, 10);
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

  function handleSubmit(formData: FormData) {
    formData.set("locale", locale);
    if (lessonId) {
      formData.set("lessonId", lessonId);
    }

    startTransition(async () => {
      const result = lessonId
        ? await updateStandaloneLessonMutationAction(formData)
        : await createStandaloneLessonMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" />
            <span>{labels.triggerCta}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-3">
          <input type="hidden" name="locale" value={locale} />
          {lessonId ? <input type="hidden" name="lessonId" value={lessonId} /> : null}
          <div className="space-y-1">
            <Label htmlFor={lessonId ? `lessonTitle-${lessonId}` : "lessonTitle-create"}>{labels.lessonTitleLabel}</Label>
            <Input id={lessonId ? `lessonTitle-${lessonId}` : "lessonTitle-create"} name="title" defaultValue={defaultTitle ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={lessonId ? `lessonDescription-${lessonId}` : "lessonDescription-create"}>{labels.lessonDescriptionLabel}</Label>
            <Textarea
              id={lessonId ? `lessonDescription-${lessonId}` : "lessonDescription-create"}
              name="description"
              defaultValue={defaultDescription ?? ""}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={lessonId ? `startsAt-${lessonId}` : "startsAt-create"}>{labels.startsAtLabel}</Label>
            <Input
              id={lessonId ? `startsAt-${lessonId}` : "startsAt-create"}
              type="datetime-local"
              name="startsAt"
              required
              defaultValue={startsAtDefault}
              onChange={(event) => validateScheduleDate(event.currentTarget)}
              onInvalid={(event) => validateScheduleDate(event.currentTarget)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={lessonId ? `duration-${lessonId}` : "duration-create"}>{labels.standaloneDuration}</Label>
              <Input
                id={lessonId ? `duration-${lessonId}` : "duration-create"}
                type="number"
                name="durationMinutes"
                min={1}
                defaultValue={defaultDurationMinutes ?? 60}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={lessonId ? `maxAttendees-${lessonId}` : "maxAttendees-create"}>{labels.standaloneMaxAttendees}</Label>
              <Input
                id={lessonId ? `maxAttendees-${lessonId}` : "maxAttendees-create"}
                type="number"
                name="maxAttendees"
                min={1}
                defaultValue={defaultMaxAttendees ?? 12}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={lessonId ? `cancelWindow-${lessonId}` : "cancelWindow-create"}>{labels.standaloneCancellationWindow}</Label>
            <Input
              id={lessonId ? `cancelWindow-${lessonId}` : "cancelWindow-create"}
              type="number"
              name="cancellationWindowHours"
              min={1}
              defaultValue={defaultCancellationWindowHours ?? 24}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={lessonId ? `trainer-${lessonId}` : "trainer-create"}>{labels.trainerLabel}</Label>
              <select
                id={lessonId ? `trainer-${lessonId}` : "trainer-create"}
                name="trainerId"
                defaultValue={defaultTrainerId ?? ""}
                className="h-9 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-2 text-xs"
              >
                <option value="">- {labels.trainerLabel} -</option>
                {trainerCandidates.map((trainer) => (
                  <option key={`create-dialog-${trainer.id}`} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={lessonId ? `lessonType-${lessonId}` : "lessonType-create"}>{labels.standaloneLessonType}</Label>
              <select
                id={lessonId ? `lessonType-${lessonId}` : "lessonType-create"}
                name="lessonTypeId"
                defaultValue={defaultLessonTypeId ?? ""}
                className="h-9 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-2 text-xs"
              >
                <option value="">- {labels.standaloneLessonType} -</option>
                {lessonTypeCandidates.map((type) => (
                  <option key={`create-dialog-type-${type.id}`} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {labels.closeCta}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? labels.processing : labels.submitCta}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

