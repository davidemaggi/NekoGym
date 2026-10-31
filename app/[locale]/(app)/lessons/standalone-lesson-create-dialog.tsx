"use client";

import { RepeatControls, type RepeatMode } from "@/components/lessons/repeat-controls";

import { appDateTimeLocalValue, weekdayOfDateKey } from "@/lib/date-time";

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
  disableTrainerSelection?: boolean;
};


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
  disableTrainerSelection = false,
}: StandaloneLessonDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const startsAtDefault = useMemo(() => {
    if (defaultStartsAt) return defaultStartsAt;
    // Next full hour on the gym's clock, whatever the device's time zone.
    return `${appDateTimeLocalValue(new Date(new Date().getTime() + 60 * 60 * 1000)).slice(0, 13)}:00`;
  }, [defaultStartsAt]);
  const openWeekdaySet = useMemo(
    () => new Set<Weekday>((openWeekdays && openWeekdays.length > 0) ? openWeekdays : DEFAULT_OPEN_WEEKDAYS),
    [openWeekdays]
  );
  const closedDateSet = useMemo(() => new Set(closedDates ?? []), [closedDates]);
  // Creating only: the start field's day seeds the repeat preview.
  const [firstDay, setFirstDay] = useState(startsAtDefault.slice(0, 10));
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");

  function validateScheduleDate(input: HTMLInputElement): boolean {
    const raw = input.value;
    // A repeated lesson may start its pattern on a closed day: closed days are skipped server-side.
    if (!raw || repeatMode !== "none") {
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
            <Plus size={18} aria-hidden="true" />
            {labels.triggerCta}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          {lessonId ? <input type="hidden" name="lessonId" value={lessonId} /> : null}
          <div className="space-y-1.5">
            <Label htmlFor={lessonId ? `lessonTitle-${lessonId}` : "lessonTitle-create"}>{labels.lessonTitleLabel}</Label>
            <Input id={lessonId ? `lessonTitle-${lessonId}` : "lessonTitle-create"} name="title" defaultValue={defaultTitle ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={lessonId ? `lessonDescription-${lessonId}` : "lessonDescription-create"}>{labels.lessonDescriptionLabel}</Label>
            <Textarea
              id={lessonId ? `lessonDescription-${lessonId}` : "lessonDescription-create"}
              name="description"
              defaultValue={defaultDescription ?? ""}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={lessonId ? `startsAt-${lessonId}` : "startsAt-create"}>{labels.startsAtLabel}</Label>
            <Input
              id={lessonId ? `startsAt-${lessonId}` : "startsAt-create"}
              type="datetime-local"
              className="tabular"
              name="startsAt"
              required
              defaultValue={startsAtDefault}
              onChange={(event) => {
                setFirstDay(event.currentTarget.value.slice(0, 10));
                validateScheduleDate(event.currentTarget);
              }}
              onInvalid={(event) => validateScheduleDate(event.currentTarget)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor={lessonId ? `duration-${lessonId}` : "duration-create"}>{labels.standaloneDuration}</Label>
              <Input
                id={lessonId ? `duration-${lessonId}` : "duration-create"}
                type="number"
                inputMode="numeric"
                className="tabular"
                name="durationMinutes"
                min={1}
                defaultValue={defaultDurationMinutes ?? 60}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={lessonId ? `maxAttendees-${lessonId}` : "maxAttendees-create"}>{labels.standaloneMaxAttendees}</Label>
              <Input
                id={lessonId ? `maxAttendees-${lessonId}` : "maxAttendees-create"}
                type="number"
                inputMode="numeric"
                className="tabular"
                name="maxAttendees"
                min={1}
                defaultValue={defaultMaxAttendees ?? 12}
                required
              />
            </div>
            <div className="col-span-2 space-y-1.5 sm:col-span-1">
              <Label htmlFor={lessonId ? `cancelWindow-${lessonId}` : "cancelWindow-create"}>{labels.standaloneCancellationWindow}</Label>
              <Input
                id={lessonId ? `cancelWindow-${lessonId}` : "cancelWindow-create"}
                type="number"
                inputMode="numeric"
                className="tabular"
                name="cancellationWindowHours"
                min={1}
                defaultValue={defaultCancellationWindowHours ?? 24}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={lessonId ? `trainer-${lessonId}` : "trainer-create"}>{labels.trainerLabel}</Label>
              {disableTrainerSelection ? (
                <input type="hidden" name="trainerId" value={defaultTrainerId ?? ""} />
              ) : null}
              <select
                id={lessonId ? `trainer-${lessonId}` : "trainer-create"}
                name="trainerId"
                defaultValue={defaultTrainerId ?? ""}
                disabled={disableTrainerSelection}
                className="ui-select w-full"
              >
                <option value="">— {labels.trainerLabel} —</option>
                {trainerCandidates.map((trainer) => (
                  <option key={`create-dialog-${trainer.id}`} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={lessonId ? `lessonType-${lessonId}` : "lessonType-create"}>{labels.standaloneLessonType}</Label>
              <select
                id={lessonId ? `lessonType-${lessonId}` : "lessonType-create"}
                name="lessonTypeId"
                defaultValue={defaultLessonTypeId ?? ""}
                className="ui-select w-full"
              >
                <option value="">— {labels.standaloneLessonType} —</option>
                {lessonTypeCandidates.map((type) => (
                  <option key={`create-dialog-type-${type.id}`} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!lessonId ? (
            <RepeatControls
              locale={locale}
              idPrefix="create-repeat"
              firstDay={firstDay}
              firstDayIsLesson
              openWeekdays={openWeekdays}
              closedDates={closedDates}
              onModeChange={setRepeatMode}
            />
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
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
