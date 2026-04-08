"use client";

import Image from "next/image";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  deleteCourseAction,
  createCourseAction,
  updateCourseAction,
} from "@/app/[locale]/(app)/courses/actions";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

const weekdayOrder: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

type ScheduleSlot = {
  weekday: Weekday;
  startTime: string;
};

type CourseItem = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  maxAttendees: number;
  trainerName: string | null;
  trainer: {
    id: string;
    name: string;
    email: string;
  } | null;
  lessonType: {
    id: string;
    name: string;
    iconSvg: string;
  } | null;
  bookingAdvanceMonths: number;
  cancellationWindowHours: number;
  scheduleSlots: ScheduleSlot[];
};

type CoursePayload = {
  id?: string;
  locale: string;
  name: string;
  description: string;
  lessonTypeId: string;
  durationMinutes: string;
  maxAttendees: string;
  trainerId: string;
  bookingAdvanceMonths: string;
  cancellationWindowHours: string;
  scheduleSlots: ScheduleSlot[];
};

type LessonTypeItem = {
  id: string;
  name: string;
  description: string | null;
  iconSvg: string;
};

type TrainerCandidate = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TRAINER" | "TRAINEE";
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TRAINER" | "TRAINEE";
};

type DeletePayload = {
  id: string;
  locale: string;
};

type ConfirmationState =
  | {
      kind: "create" | "update";
      title: string;
      description: string;
      payload: CoursePayload;
    }
  | {
      kind: "delete";
      title: string;
      description: string;
      payload: DeletePayload;
    };

type CoursesManagerProps = {
  locale: string;
  courses: CourseItem[];
  currentUser: CurrentUser;
  trainerCandidates: TrainerCandidate[];
  lessonTypes: LessonTypeItem[];
  labels: {
    title: string;
    subtitle: string;
    createCta: string;
    createTitle: string;
    createDescription: string;
    updateTitle: string;
    updateDescription: string;
    reviewCreate: string;
    reviewUpdate: string;
    catalogTitle: string;
    empty: string;
    searchPlaceholder: string;
    filterAll: string;
    filterWithTrainer: string;
    filterWithoutTrainer: string;
    columns: {
      name: string;
      lessonType: string;
      duration: string;
      maxAttendees: string;
      trainer: string;
      schedule: string;
      actions: string;
    };
    actions: {
      edit: string;
      delete: string;
      cancel: string;
      confirm: string;
      processing: string;
    };
    fields: {
      name: string;
      description: string;
      lessonType: string;
      trainer: string;
      durationMinutes: string;
      maxAttendees: string;
      bookingAdvanceMonths: string;
      cancellationWindowHours: string;
    };
    confirm: {
      createTitle: string;
      createDescription: string;
      updateTitle: string;
      updateDescription: string;
      deleteTitle: string;
      deleteDescription: string;
    };
    validation: {
      nameRequired: string;
      lessonTypeRequired: string;
      trainerRequired: string;
      descriptionRequired: string;
      numericInvalid: string;
      numericPositive: string;
      scheduleRequired: string;
      scheduleInvalid: string;
    };
    schedule: {
      title: string;
      description: string;
      addSlot: string;
      noSlots: string;
      removeSlot: string;
      weekdays: Record<Weekday, string>;
    };
  };
};

function coursePayloadToFormData(payload: CoursePayload): FormData {
  const formData = new FormData();
  formData.set("locale", payload.locale);
  if (payload.id) formData.set("id", payload.id);
  formData.set("name", payload.name);
  formData.set("description", payload.description);
  formData.set("lessonTypeId", payload.lessonTypeId);
  formData.set("durationMinutes", payload.durationMinutes);
  formData.set("maxAttendees", payload.maxAttendees);
  formData.set("trainerId", payload.trainerId);
  formData.set("bookingAdvanceMonths", payload.bookingAdvanceMonths);
  formData.set("cancellationWindowHours", payload.cancellationWindowHours);
  formData.set("scheduleSlots", JSON.stringify(payload.scheduleSlots));
  return formData;
}

function deletePayloadToFormData(payload: DeletePayload): FormData {
  const formData = new FormData();
  formData.set("id", payload.id);
  formData.set("locale", payload.locale);
  return formData;
}

function readCoursePayload(form: HTMLFormElement, locale: string, scheduleSlots: ScheduleSlot[], id?: string): CoursePayload {
  const formData = new FormData(form);

  return {
    id,
    locale,
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    lessonTypeId: String(formData.get("lessonTypeId") ?? "").trim(),
    durationMinutes: String(formData.get("durationMinutes") ?? "").trim(),
    maxAttendees: String(formData.get("maxAttendees") ?? "").trim(),
    trainerId: String(formData.get("trainerId") ?? "").trim(),
    bookingAdvanceMonths: String(formData.get("bookingAdvanceMonths") ?? "").trim(),
    cancellationWindowHours: String(formData.get("cancellationWindowHours") ?? "").trim(),
    scheduleSlots,
  };
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function normalizeScheduleSlots(slots: ScheduleSlot[]): ScheduleSlot[] {
  return [...slots].sort((a, b) => {
    if (a.weekday === b.weekday) return a.startTime.localeCompare(b.startTime);
    return a.weekday.localeCompare(b.weekday);
  });
}

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startTotal = hours * 60 + minutes;
  const endTotal = (startTotal + durationMinutes) % (24 * 60);
  const endHours = String(Math.floor(endTotal / 60)).padStart(2, "0");
  const endMinutes = String(endTotal % 60).padStart(2, "0");
  return `${endHours}:${endMinutes}`;
}

function formatScheduleRows(
  slots: ScheduleSlot[],
  durationMinutes: number,
  weekdays: Record<Weekday, string>
): Array<{ day: string; ranges: string[] }> {
  const grouped = new Map<Weekday, string[]>();

  for (const day of weekdayOrder) {
    grouped.set(day, []);
  }

  for (const slot of slots) {
    const list = grouped.get(slot.weekday) ?? [];
    list.push(`${slot.startTime}-${computeEndTime(slot.startTime, durationMinutes)}`);
    grouped.set(slot.weekday, list);
  }

  return weekdayOrder
    .map((day) => {
      const ranges = grouped.get(day) ?? [];
      if (ranges.length === 0) return null;
      return { day: weekdays[day], ranges };
    })
    .filter((row): row is { day: string; ranges: string[] } => Boolean(row));
}

function validateCoursePayloadClient(
  payload: CoursePayload,
  labels: CoursesManagerProps["labels"]
): string | null {
  if (!payload.name) return labels.validation.nameRequired;
  if (!payload.lessonTypeId) return labels.validation.lessonTypeRequired;
  if (!payload.trainerId) return labels.validation.trainerRequired;

  const numericValues = [
    Number.parseInt(payload.durationMinutes, 10),
    Number.parseInt(payload.maxAttendees, 10),
    Number.parseInt(payload.bookingAdvanceMonths, 10),
    Number.parseInt(payload.cancellationWindowHours, 10),
  ];

  if (numericValues.some((value) => Number.isNaN(value))) {
    return labels.validation.numericInvalid;
  }

  if (numericValues.some((value) => value <= 0)) {
    return labels.validation.numericPositive;
  }

  if (payload.scheduleSlots.length === 0) {
    return labels.validation.scheduleRequired;
  }

  const unique = new Set<string>();
  for (const slot of payload.scheduleSlots) {
    if (!isValidTime(slot.startTime)) {
      return labels.validation.scheduleInvalid;
    }

    const key = `${slot.weekday}-${slot.startTime}`;
    if (unique.has(key)) {
      return labels.validation.scheduleInvalid;
    }
    unique.add(key);
  }

  return null;
}

export function CoursesManager({
  locale,
  courses,
  labels,
  currentUser,
  trainerCandidates,
  lessonTypes,
}: CoursesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const weekdays = useMemo(
    () =>
      (["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as Weekday[]).map(
        (day) => ({ value: day, label: labels.schedule.weekdays[day] })
      ),
    [labels.schedule.weekdays]
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [search, setSearch] = useState("");
  const [trainerFilter, setTrainerFilter] = useState<"all" | "with" | "without">("all");
  const [createSchedule, setCreateSchedule] = useState<ScheduleSlot[]>([]);
  const [editSchedule, setEditSchedule] = useState<ScheduleSlot[]>([]);

  const emptyDraft = useMemo(
    () => ({
      name: "",
      description: "",
      lessonTypeId: lessonTypes[0]?.id ?? "",
      durationMinutes: "60",
      maxAttendees: "12",
      trainerId: currentUser.role === "TRAINER" ? currentUser.id : trainerCandidates[0]?.id ?? "",
      bookingAdvanceMonths: "2",
      cancellationWindowHours: "24",
    }),
    [currentUser.id, currentUser.role, lessonTypes, trainerCandidates]
  );

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses.filter((course) => {
      if (trainerFilter === "with" && !course.trainerName) return false;
      if (trainerFilter === "without" && course.trainerName) return false;

      if (!query) return true;

      const byName = course.name.toLowerCase().includes(query);
      const byTrainer = (course.trainerName ?? "").toLowerCase().includes(query);
      return byName || byTrainer;
    });
  }, [courses, search, trainerFilter]);

  function askCreateConfirmation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = readCoursePayload(event.currentTarget, locale, createSchedule);
    const validationError = validateCoursePayloadClient(payload, labels);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setConfirmation({
      kind: "create",
      title: labels.confirm.createTitle,
      description: labels.confirm.createDescription,
      payload,
    });
  }

  function askUpdateConfirmation(event: FormEvent<HTMLFormElement>, courseId: string) {
    event.preventDefault();
    const payload = readCoursePayload(event.currentTarget, locale, editSchedule, courseId);
    const validationError = validateCoursePayloadClient(payload, labels);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setConfirmation({
      kind: "update",
      title: labels.confirm.updateTitle,
      description: labels.confirm.updateDescription,
      payload,
    });
  }

  function askDeleteConfirmation(courseId: string, courseName: string) {
    setConfirmation({
      kind: "delete",
      title: labels.confirm.deleteTitle,
      description: labels.confirm.deleteDescription.replace("{name}", courseName),
      payload: { id: courseId, locale },
    });
  }

  function closeDialogsAfterSuccess() {
    setCreateOpen(false);
    setEditOpen(false);
    setSelectedCourse(null);
    setCreateSchedule([]);
    setEditSchedule([]);
  }

  function addScheduleSlot(target: "create" | "edit", weekday: Weekday, startTime: string) {
    if (!isValidTime(startTime)) return;

    if (target === "create") {
      setCreateSchedule((prev) => normalizeScheduleSlots([...prev, { weekday, startTime }]));
      return;
    }

    setEditSchedule((prev) => normalizeScheduleSlots([...prev, { weekday, startTime }]));
  }

  function removeScheduleSlot(target: "create" | "edit", weekday: Weekday, startTime: string) {
    if (target === "create") {
      setCreateSchedule((prev) => prev.filter((slot) => !(slot.weekday === weekday && slot.startTime === startTime)));
      return;
    }

    setEditSchedule((prev) => prev.filter((slot) => !(slot.weekday === weekday && slot.startTime === startTime)));
  }

  function submitConfirmedAction() {
    if (!confirmation) return;

    const currentConfirmation = confirmation;

    startTransition(async () => {
      let result;

      if (currentConfirmation.kind === "delete") {
        const payload = currentConfirmation.payload as DeletePayload;
        result = await deleteCourseAction(deletePayloadToFormData(payload));
      } else if (currentConfirmation.kind === "create") {
        result = await createCourseAction(coursePayloadToFormData(currentConfirmation.payload));
      } else {
        result = await updateCourseAction(coursePayloadToFormData(currentConfirmation.payload));
      }

      if (result.ok) {
        toast.success(result.message);
        closeDialogsAfterSuccess();
        router.refresh();
      } else {
        toast.error(result.message);
      }

      setConfirmation(null);
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{labels.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">

          <Dialog
            open={createOpen}
            onOpenChange={(nextOpen) => {
              setCreateOpen(nextOpen);
              if (!nextOpen) setCreateSchedule([]);
            }}
          >
            <DialogTrigger asChild>
              <Button>{labels.createCta}</Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>{labels.createTitle}</DialogTitle>
              <DialogDescription>{labels.createDescription}</DialogDescription>
            </DialogHeader>

            <form className="space-y-3" onSubmit={askCreateConfirmation}>
              <CourseFields
                defaultValues={emptyDraft}
                labels={labels.fields}
                scheduleLabels={labels.schedule}
                weekdays={weekdays}
                scheduleSlots={createSchedule}
                lessonTypes={lessonTypes}
                trainerCandidates={trainerCandidates}
                currentUser={currentUser}
                onAddSlot={(weekday, startTime) => addScheduleSlot("create", weekday, startTime)}
                onRemoveSlot={(weekday, startTime) => removeScheduleSlot("create", weekday, startTime)}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                  {labels.actions.cancel}
                </Button>
                <Button type="submit">{labels.reviewCreate}</Button>
              </DialogFooter>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{labels.catalogTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.searchPlaceholder}
            />
            <select
              value={trainerFilter}
              onChange={(event) => setTrainerFilter(event.target.value as "all" | "with" | "without")}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="all">{labels.filterAll}</option>
              <option value="with">{labels.filterWithTrainer}</option>
              <option value="without">{labels.filterWithoutTrainer}</option>
            </select>
          </div>

          {filteredCourses.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{labels.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                    <th className="py-2 pr-2">{labels.columns.name}</th>
                    <th className="py-2 pr-2">{labels.columns.lessonType}</th>
                    <th className="py-2 pr-2">{labels.columns.duration}</th>
                    <th className="py-2 pr-2">{labels.columns.maxAttendees}</th>
                    <th className="py-2 pr-2">{labels.columns.trainer}</th>
                    <th className="py-2 pr-2">{labels.columns.schedule}</th>
                    <th className="py-2 text-right">{labels.columns.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="border-b border-zinc-100 dark:border-zinc-800/60">
                      <td className="py-3 pr-2 font-medium">{course.name}</td>
                      <td className="py-3 pr-2">
                        {course.lessonType ? (
                          <div className="inline-flex items-center gap-2">
                            <Image src={course.lessonType.iconSvg} alt={course.lessonType.name} width={18} height={18} />
                            <span>{course.lessonType.name}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 pr-2">{course.durationMinutes} min</td>
                      <td className="py-3 pr-2">{course.maxAttendees}</td>
                      <td className="py-3 pr-2">{course.trainer?.name ?? course.trainerName ?? "-"}</td>
                      <td className="py-3 pr-2 text-xs text-zinc-600 dark:text-zinc-300">
                        {(() => {
                          const scheduleGroups = formatScheduleRows(
                            course.scheduleSlots,
                            course.durationMinutes,
                            labels.schedule.weekdays
                          );

                          if (scheduleGroups.length === 0) {
                            return "-";
                          }

                          return (
                            <div className="space-y-2">
                              {scheduleGroups.map((group) => (
                                <div key={`${course.id}-${group.day}`} className="flex flex-wrap items-center gap-1">
                                  <span className="rounded-md bg-zinc-200 px-2 py-0.5 font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                                    {group.day}
                                  </span>
                                  {group.ranges.map((range) => (
                                    <span
                                      key={`${course.id}-${group.day}-${range}`}
                                      className="rounded-md border border-zinc-200 px-2 py-0.5 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                                    >
                                      {range}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCourse(course);
                              setEditSchedule(normalizeScheduleSlots(course.scheduleSlots));
                              setEditOpen(true);
                            }}
                          >
                            {labels.actions.edit}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => askDeleteConfirmation(course.id, course.name)}
                          >
                            {labels.actions.delete}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(nextOpen) => {
          setEditOpen(nextOpen);
          if (!nextOpen) {
            setSelectedCourse(null);
            setEditSchedule([]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.updateTitle}</DialogTitle>
            <DialogDescription>{labels.updateDescription}</DialogDescription>
          </DialogHeader>

          {selectedCourse ? (
            <form
              className="space-y-3"
              onSubmit={(event) => askUpdateConfirmation(event, selectedCourse.id)}
            >
              <CourseFields
                defaultValues={{
                  name: selectedCourse.name,
                  description: selectedCourse.description ?? "",
                  lessonTypeId: selectedCourse.lessonType?.id ?? "",
                  durationMinutes: String(selectedCourse.durationMinutes),
                  maxAttendees: String(selectedCourse.maxAttendees),
                  trainerId: selectedCourse.trainer?.id ?? currentUser.id,
                  bookingAdvanceMonths: String(selectedCourse.bookingAdvanceMonths),
                  cancellationWindowHours: String(selectedCourse.cancellationWindowHours),
                }}
                labels={labels.fields}
                scheduleLabels={labels.schedule}
                weekdays={weekdays}
                scheduleSlots={editSchedule}
                lessonTypes={lessonTypes}
                trainerCandidates={trainerCandidates}
                currentUser={currentUser}
                onAddSlot={(weekday, startTime) => addScheduleSlot("edit", weekday, startTime)}
                onRemoveSlot={(weekday, startTime) => removeScheduleSlot("edit", weekday, startTime)}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
                  {labels.actions.cancel}
                </Button>
                <Button type="submit">{labels.reviewUpdate}</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmation)} onOpenChange={(open) => !open && setConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmation?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary" disabled={isPending}>
                {labels.actions.cancel}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={submitConfirmedAction} disabled={isPending}>
                {isPending ? labels.actions.processing : labels.actions.confirm}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function CourseFields({
  defaultValues,
  labels,
  scheduleLabels,
  weekdays,
  scheduleSlots,
  lessonTypes,
  trainerCandidates,
  currentUser,
  onAddSlot,
  onRemoveSlot,
}: {
  defaultValues: {
    name: string;
    description: string;
    lessonTypeId: string;
    durationMinutes: string;
    maxAttendees: string;
    trainerId: string;
    bookingAdvanceMonths: string;
    cancellationWindowHours: string;
  };
  labels: CoursesManagerProps["labels"]["fields"];
  scheduleLabels: CoursesManagerProps["labels"]["schedule"];
  weekdays: Array<{ value: Weekday; label: string }>;
  scheduleSlots: ScheduleSlot[];
  lessonTypes: LessonTypeItem[];
  trainerCandidates: TrainerCandidate[];
  currentUser: CurrentUser;
  onAddSlot: (weekday: Weekday, startTime: string) => void;
  onRemoveSlot: (weekday: Weekday, startTime: string) => void;
}) {
  const [dayToAdd, setDayToAdd] = useState<Weekday>("MONDAY");
  const [timeToAdd, setTimeToAdd] = useState("08:00");
  const [durationInput, setDurationInput] = useState(defaultValues.durationMinutes);
  const [selectedLessonTypeId, setSelectedLessonTypeId] = useState(defaultValues.lessonTypeId);

  const selectedLessonType = lessonTypes.find((type) => type.id === selectedLessonTypeId) ?? null;

  const durationValue = Number.parseInt(durationInput, 10);
  const durationMinutes = Number.isNaN(durationValue) || durationValue <= 0 ? 60 : durationValue;

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="name">{labels.name}</Label>
        <Input id="name" name="name" required defaultValue={defaultValues.name} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">{labels.description}</Label>
        <Textarea id="description" name="description" defaultValue={defaultValues.description} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="lessonTypeId">{labels.lessonType}</Label>
          <select
            id="lessonTypeId"
            name="lessonTypeId"
            required
            defaultValue={defaultValues.lessonTypeId}
            onChange={(event) => setSelectedLessonTypeId(event.target.value)}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">-</option>
            {lessonTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {selectedLessonType ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1 dark:border-zinc-800">
              <Image src={selectedLessonType.iconSvg} alt={selectedLessonType.name} width={22} height={22} />
              <span className="text-xs text-zinc-600 dark:text-zinc-300">{selectedLessonType.name}</span>
            </div>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="trainerId">{labels.trainer}</Label>
          <select
            id="trainerId"
            name="trainerId"
            required
            defaultValue={defaultValues.trainerId}
            disabled={currentUser.role === "TRAINER"}
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {trainerCandidates.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name} ({trainer.email})
              </option>
            ))}
          </select>
          {currentUser.role === "TRAINER" ? (
            <input type="hidden" name="trainerId" value={currentUser.id} />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="durationMinutes">{labels.durationMinutes}</Label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={1}
            required
            defaultValue={defaultValues.durationMinutes}
            onChange={(event) => setDurationInput(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="maxAttendees">{labels.maxAttendees}</Label>
          <Input
            id="maxAttendees"
            name="maxAttendees"
            type="number"
            min={1}
            required
            defaultValue={defaultValues.maxAttendees}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="bookingAdvanceMonths">{labels.bookingAdvanceMonths}</Label>
          <Input
            id="bookingAdvanceMonths"
            name="bookingAdvanceMonths"
            type="number"
            min={1}
            required
            defaultValue={defaultValues.bookingAdvanceMonths}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cancellationWindowHours">{labels.cancellationWindowHours}</Label>
          <Input
            id="cancellationWindowHours"
            name="cancellationWindowHours"
            type="number"
            min={1}
            required
            defaultValue={defaultValues.cancellationWindowHours}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
        <p className="text-sm font-medium">{scheduleLabels.title}</p>
        <p className="text-xs text-zinc-600 dark:text-zinc-300">{scheduleLabels.description}</p>

        <div className="flex flex-col gap-2 md:flex-row">
          <select
            value={dayToAdd}
            onChange={(event) => setDayToAdd(event.target.value as Weekday)}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {weekdays.map((weekday) => (
              <option key={weekday.value} value={weekday.value}>
                {weekday.label}
              </option>
            ))}
          </select>
          <Input type="time" value={timeToAdd} onChange={(event) => setTimeToAdd(event.target.value)} />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onAddSlot(dayToAdd, timeToAdd);
            }}
          >
            {scheduleLabels.addSlot}
          </Button>
        </div>

        {scheduleSlots.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{scheduleLabels.noSlots}</p>
        ) : (
          <div className="space-y-2">
            {weekdays.map((weekday) => {
              const daySlots = scheduleSlots.filter((slot) => slot.weekday === weekday.value);
              if (daySlots.length === 0) return null;

              return (
                <div key={weekday.value} className="space-y-1">
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{weekday.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <div
                        key={`${slot.weekday}-${slot.startTime}`}
                        className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
                      >
                        <span>
                          {slot.startTime} - {computeEndTime(slot.startTime, durationMinutes)}
                        </span>
                        <button
                          type="button"
                          className="text-red-600 hover:underline"
                          onClick={() => onRemoveSlot(slot.weekday, slot.startTime)}
                        >
                          {scheduleLabels.removeSlot}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
