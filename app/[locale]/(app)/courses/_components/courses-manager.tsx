"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

import {
  deleteCourseAction,
  restoreCourseAction,
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
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
type CourseFormTab = "main" | "schedule";

const weekdayOrder: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

type ScheduleSlot = {
  weekday: Weekday;
  startTime: string;
};

type CourseItem = {
  id: string;
  canManage: boolean;
  deletedAt: Date | null;
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
    colorHex: string;
  } | null;
  bookingAdvanceMonths: number;
  cancellationWindowHours: number;
  scheduleSlots: ScheduleSlot[];
  futureBookedLessonsCount: number;
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
  colorHex: string;
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
  bookedFuturePolicy: "keep" | "cancel";
};

type DeletePolicyChoiceState = {
  id: string;
  name: string;
  futureBookedLessonsCount: number;
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
  includeDeleted: boolean;
  currentUser: CurrentUser;
  trainerCandidates: TrainerCandidate[];
  lessonTypes: LessonTypeItem[];
  availableWeekdays: Weekday[];
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
    tabs: {
      main: string;
    };
    catalogTitle: string;
    empty: string;
    searchPlaceholder: string;
    filterAll: string;
    filterWithTrainer: string;
    filterWithoutTrainer: string;
    showDeletedCta: string;
    hideDeletedCta: string;
    deletedTag: string;
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
      restore: string;
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
      deletePolicyTitle: string;
      deletePolicyDescription: string;
      deletePolicyKeepCta: string;
      deletePolicyCancelCta: string;
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
      scheduleOverlap: string;
      scheduleClosedWeekday: string;
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
  formData.set("bookedFuturePolicy", payload.bookedFuturePolicy);
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

function toMinutes(value: string): number {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number.parseInt(hourRaw ?? "", 10);
  const minute = Number.parseInt(minuteRaw ?? "", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return -1;
  return hour * 60 + minute;
}

function hasOverlappingScheduleSlots(slots: ScheduleSlot[], durationMinutes: number): boolean {
  const grouped = new Map<Weekday, number[]>();
  for (const slot of slots) {
    const minute = toMinutes(slot.startTime);
    if (minute < 0) return true;
    const list = grouped.get(slot.weekday) ?? [];
    list.push(minute);
    grouped.set(slot.weekday, list);
  }

  for (const starts of grouped.values()) {
    const sorted = [...starts].sort((a, b) => a - b);
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const currentStart = sorted[index];
      const currentEnd = currentStart + durationMinutes;
      const nextStart = sorted[index + 1];
      if (nextStart < currentEnd) {
        return true;
      }
    }
  }

  return false;
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
  labels: CoursesManagerProps["labels"],
  availableWeekdays: Weekday[]
): string | null {
  if (!payload.name) return labels.validation.nameRequired;
  if (!payload.lessonTypeId) return labels.validation.lessonTypeRequired;

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

  const openWeekdaySet = new Set(availableWeekdays);
  if (payload.scheduleSlots.some((slot) => !openWeekdaySet.has(slot.weekday))) {
    return labels.validation.scheduleClosedWeekday;
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

  const durationMinutes = Number.parseInt(payload.durationMinutes, 10);
  if (!Number.isNaN(durationMinutes) && hasOverlappingScheduleSlots(payload.scheduleSlots, durationMinutes)) {
    return labels.validation.scheduleOverlap;
  }

  return null;
}

export function CoursesManager({
  locale,
  courses,
  includeDeleted,
  labels,
  currentUser,
  trainerCandidates,
  lessonTypes,
  availableWeekdays,
}: CoursesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const weekdays = useMemo(
    () => availableWeekdays.map((day) => ({ value: day, label: labels.schedule.weekdays[day] })),
    [availableWeekdays, labels.schedule.weekdays]
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [createTab, setCreateTab] = useState<CourseFormTab>("main");
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<CourseFormTab>("main");
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [search, setSearch] = useState("");
  const [trainerFilter, setTrainerFilter] = useState<"all" | "with" | "without">("all");
  const [createSchedule, setCreateSchedule] = useState<ScheduleSlot[]>([]);
  const [editSchedule, setEditSchedule] = useState<ScheduleSlot[]>([]);
  const [deletePolicyChoice, setDeletePolicyChoice] = useState<DeletePolicyChoiceState | null>(null);

  const emptyDraft = useMemo(
    () => ({
      name: "",
      description: "",
      lessonTypeId: lessonTypes[0]?.id ?? "",
      durationMinutes: "60",
      maxAttendees: "12",
      trainerId: currentUser.role === "TRAINER" ? currentUser.id : "",
      bookingAdvanceMonths: "2",
      cancellationWindowHours: "24",
    }),
    [currentUser.id, currentUser.role, lessonTypes]
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
    const validationError = validateCoursePayloadClient(payload, labels, availableWeekdays);
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
    const validationError = validateCoursePayloadClient(payload, labels, availableWeekdays);
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

  function openDeleteConfirmation(courseId: string, courseName: string, bookedFuturePolicy: "keep" | "cancel") {
    setConfirmation({
      kind: "delete",
      title: labels.confirm.deleteTitle,
      description: labels.confirm.deleteDescription.replace("{name}", courseName),
      payload: { id: courseId, locale, bookedFuturePolicy },
    });
  }

  function askDeleteConfirmation(courseId: string, courseName: string, futureBookedLessonsCount: number) {
    if (futureBookedLessonsCount > 0) {
      setDeletePolicyChoice({
        id: courseId,
        name: courseName,
        futureBookedLessonsCount,
      });
      return;
    }

    openDeleteConfirmation(courseId, courseName, "cancel");
  }

  function closeDialogsAfterSuccess() {
    setCreateOpen(false);
    setEditOpen(false);
    setSelectedCourse(null);
    setCreateSchedule([]);
    setEditSchedule([]);
  }

  function restoreCourse(courseId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", courseId);
      formData.set("locale", locale);

      const result = await restoreCourseAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
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
          <p className="text-sm text-[var(--muted-foreground)]">{labels.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === "ADMIN" ? (
            <a
              className="inline-flex h-9 items-center rounded-md border border-[var(--surface-border)] px-3 text-sm hover:bg-[var(--muted)]"
              href={`/${locale}/courses${includeDeleted ? "" : "?showDeleted=1"}`}
            >
              {includeDeleted ? labels.hideDeletedCta : labels.showDeletedCta}
            </a>
          ) : null}

          <Dialog
            open={createOpen}
            onOpenChange={(nextOpen) => {
              setCreateOpen(nextOpen);
              if (!nextOpen) {
                setCreateSchedule([]);
                setCreateTab("main");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                <span>{labels.createCta}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>{labels.createTitle}</DialogTitle>
              <DialogDescription>{labels.createDescription}</DialogDescription>
            </DialogHeader>

            <div className="inline-flex rounded-md border border-[var(--surface-border)] p-1">
              <button
                type="button"
                onClick={() => setCreateTab("main")}
                className={[
                  "rounded px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  createTab === "main"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                ].join(" ")}
              >
                Main
              </button>
              <button
                type="button"
                onClick={() => setCreateTab("schedule")}
                className={[
                  "rounded px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  createTab === "schedule"
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                ].join(" ")}
              >
                {labels.schedule.title}
              </button>
            </div>

            <form className="space-y-3" onSubmit={askCreateConfirmation}>
              <CourseFields
                activeTab={createTab}
                defaultValues={emptyDraft}
                labels={labels.fields}
                validationLabels={labels.validation}
                scheduleLabels={labels.schedule}
                weekdays={weekdays}
                scheduleSlots={createSchedule}
                lessonTypes={lessonTypes}
                trainerCandidates={trainerCandidates}
                onAddSlot={(weekday, startTime) => addScheduleSlot("create", weekday, startTime)}
                onRemoveSlot={(weekday, startTime) => removeScheduleSlot("create", weekday, startTime)}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                  {labels.actions.cancel}
                </Button>
                <Button type="submit">
                  <Plus className="h-4 w-4" />
                  <span>{labels.reviewCreate}</span>
                </Button>
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
              className="h-10 rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
            >
              <option value="all">{labels.filterAll}</option>
              <option value="with">{labels.filterWithTrainer}</option>
              <option value="without">{labels.filterWithoutTrainer}</option>
            </select>
          </div>

          {filteredCourses.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">{labels.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--surface-border)] text-left">
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
                    <tr key={course.id} className="border-b border-[var(--surface-border)]/70">
                      <td className="py-3 pr-2 font-medium">{course.name}</td>
                      <td className="py-3 pr-2">
                        <div className="inline-flex items-center gap-2">
                          {course.lessonType ? (
                            <div className="inline-flex items-center gap-2">
                              <LessonTypeIcon
                                iconPath={course.lessonType.iconSvg}
                                colorHex={course.lessonType.colorHex}
                                size={18}
                                title={course.lessonType.name}
                              />
                              <span>{course.lessonType.name}</span>
                            </div>
                          ) : (
                            "-"
                          )}
                          {course.deletedAt ? (
                            <span className="rounded-md border border-[var(--danger-hover)] px-1.5 py-0.5 text-[10px] text-[var(--danger-fg)] dark:border-red-800 dark:text-red-300">
                              {labels.deletedTag}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 pr-2">{course.durationMinutes} min</td>
                      <td className="py-3 pr-2">{course.maxAttendees}</td>
                      <td className="py-3 pr-2">{course.trainer?.name ?? course.trainerName ?? "-"}</td>
                      <td className="py-3 pr-2 text-xs text-[var(--muted-foreground)]">
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
                                  <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 font-medium text-[var(--foreground)]">
                                    {group.day}
                                  </span>
                                  {group.ranges.map((range) => (
                                    <span
                                      key={`${course.id}-${group.day}-${range}`}
                                      className="rounded-md border border-[var(--surface-border)] px-2 py-0.5 text-[var(--foreground)]"
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
                          {course.deletedAt && course.canManage ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restoreCourse(course.id)}
                              disabled={isPending}
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span>{labels.actions.restore}</span>
                            </Button>
                          ) : !course.deletedAt && course.canManage ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCourse(course);
                                  setEditSchedule(normalizeScheduleSlots(course.scheduleSlots));
                                  setEditTab("main");
                                  setEditOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span>{labels.actions.edit}</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => askDeleteConfirmation(course.id, course.name, course.futureBookedLessonsCount)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{labels.actions.delete}</span>
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--muted-foreground)]">-</span>
                          )}
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
            setEditTab("main");
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
              <div className="inline-flex rounded-md border border-[var(--surface-border)] p-1">
                <button
                  type="button"
                  onClick={() => setEditTab("main")}
                  className={[
                    "rounded px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    editTab === "main"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                  ].join(" ")}
                >
                  {labels.tabs.main}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab("schedule")}
                  className={[
                    "rounded px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    editTab === "schedule"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                  ].join(" ")}
                >
                  {labels.schedule.title}
                </button>
              </div>
              <CourseFields
                activeTab={editTab}
                defaultValues={{
                  name: selectedCourse.name,
                  description: selectedCourse.description ?? "",
                  lessonTypeId: selectedCourse.lessonType?.id ?? "",
                  durationMinutes: String(selectedCourse.durationMinutes),
                  maxAttendees: String(selectedCourse.maxAttendees),
                  trainerId: selectedCourse.trainer?.id ?? "",
                  bookingAdvanceMonths: String(selectedCourse.bookingAdvanceMonths),
                  cancellationWindowHours: String(selectedCourse.cancellationWindowHours),
                }}
                labels={labels.fields}
                validationLabels={labels.validation}
                scheduleLabels={labels.schedule}
                weekdays={weekdays}
                scheduleSlots={editSchedule}
                lessonTypes={lessonTypes}
                trainerCandidates={trainerCandidates}
                onAddSlot={(weekday, startTime) => addScheduleSlot("edit", weekday, startTime)}
                onRemoveSlot={(weekday, startTime) => removeScheduleSlot("edit", weekday, startTime)}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
                  {labels.actions.cancel}
                </Button>
                <Button type="submit">
                  <Pencil className="h-4 w-4" />
                  <span>{labels.reviewUpdate}</span>
                </Button>
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

      <AlertDialog open={Boolean(deletePolicyChoice)} onOpenChange={(open) => !open && setDeletePolicyChoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.confirm.deletePolicyTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.confirm.deletePolicyDescription
                .replace("{name}", deletePolicyChoice?.name ?? "")
                .replace("{count}", String(deletePolicyChoice?.futureBookedLessonsCount ?? 0))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">{labels.actions.cancel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="outline"
                onClick={() => {
                  if (!deletePolicyChoice) return;
                  openDeleteConfirmation(deletePolicyChoice.id, deletePolicyChoice.name, "keep");
                  setDeletePolicyChoice(null);
                }}
              >
                {labels.confirm.deletePolicyKeepCta}
              </Button>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!deletePolicyChoice) return;
                  openDeleteConfirmation(deletePolicyChoice.id, deletePolicyChoice.name, "cancel");
                  setDeletePolicyChoice(null);
                }}
              >
                {labels.confirm.deletePolicyCancelCta}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function CourseFields({
  activeTab = "main",
  defaultValues,
  labels,
  validationLabels,
  scheduleLabels,
  weekdays,
  scheduleSlots,
  lessonTypes,
  trainerCandidates,
  onAddSlot,
  onRemoveSlot,
}: {
  activeTab?: CourseFormTab;
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
  validationLabels: CoursesManagerProps["labels"]["validation"];
  scheduleLabels: CoursesManagerProps["labels"]["schedule"];
  weekdays: Array<{ value: Weekday; label: string }>;
  scheduleSlots: ScheduleSlot[];
  lessonTypes: LessonTypeItem[];
  trainerCandidates: TrainerCandidate[];
  onAddSlot: (weekday: Weekday, startTime: string) => void;
  onRemoveSlot: (weekday: Weekday, startTime: string) => void;
}) {
  const [dayToAdd, setDayToAdd] = useState<Weekday>(() => weekdays[0]?.value ?? "MONDAY");
  const [timeToAdd, setTimeToAdd] = useState("08:00");
  const [durationInput, setDurationInput] = useState(defaultValues.durationMinutes);
  const [selectedLessonTypeId, setSelectedLessonTypeId] = useState(defaultValues.lessonTypeId);

  const selectedLessonType = lessonTypes.find((type) => type.id === selectedLessonTypeId) ?? null;

  const durationValue = Number.parseInt(durationInput, 10);
  const durationMinutes = Number.isNaN(durationValue) || durationValue <= 0 ? 60 : durationValue;
  const safeDayToAdd = weekdays.some((weekday) => weekday.value === dayToAdd)
    ? dayToAdd
    : (weekdays[0]?.value ?? "MONDAY");

  return (
    <>
      <div className={activeTab === "main" ? "space-y-1" : "hidden"}>
        <Label htmlFor="name">{labels.name}</Label>
        <Input id="name" name="name" required defaultValue={defaultValues.name} />
      </div>

      <div className={activeTab === "main" ? "space-y-1" : "hidden"}>
        <Label htmlFor="description">{labels.description}</Label>
        <Textarea id="description" name="description" defaultValue={defaultValues.description} />
      </div>

      <div className={activeTab === "main" ? "grid grid-cols-2 gap-3" : "hidden"}>
        <div className="space-y-1">
          <Label htmlFor="lessonTypeId">{labels.lessonType}</Label>
          <select
            id="lessonTypeId"
            name="lessonTypeId"
            required
            defaultValue={defaultValues.lessonTypeId}
            onChange={(event) => setSelectedLessonTypeId(event.target.value)}
            className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
          >
            <option value="">-</option>
            {lessonTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {selectedLessonType ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-[var(--surface-border)] px-2 py-1">
              <LessonTypeIcon
                iconPath={selectedLessonType.iconSvg}
                colorHex={selectedLessonType.colorHex}
                size={22}
                title={selectedLessonType.name}
              />
              <span className="text-xs text-[var(--muted-foreground)]">{selectedLessonType.name}</span>
            </div>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="trainerId">{labels.trainer}</Label>
          <select
            id="trainerId"
            name="trainerId"
            defaultValue={defaultValues.trainerId}
            className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
          >
            <option value="">-</option>
            {trainerCandidates.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name} ({trainer.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={activeTab === "main" ? "grid grid-cols-2 gap-3" : "hidden"}>
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

      <div className={activeTab === "main" ? "grid grid-cols-2 gap-3" : "hidden"}>
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

      <div className={activeTab === "schedule" ? "space-y-2 rounded-md border border-[var(--surface-border)] p-3" : "hidden"}>
        <p className="text-sm font-medium">{scheduleLabels.title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{scheduleLabels.description}</p>

        <div className="flex flex-col gap-2 md:flex-row">
          <select
            value={safeDayToAdd}
            onChange={(event) => setDayToAdd(event.target.value as Weekday)}
            className="h-10 rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
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
            disabled={weekdays.length === 0}
            onClick={() => {
              const nextSlots = normalizeScheduleSlots([...scheduleSlots, { weekday: safeDayToAdd, startTime: timeToAdd }]);
              if (hasOverlappingScheduleSlots(nextSlots, durationMinutes)) {
                toast.error(validationLabels.scheduleOverlap);
                return;
              }
              onAddSlot(safeDayToAdd, timeToAdd);
            }}
          >
            {scheduleLabels.addSlot}
          </Button>
        </div>

        {scheduleSlots.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">{scheduleLabels.noSlots}</p>
        ) : (
          <div className="space-y-2">
            {weekdayOrder.map((weekday) => {
              const daySlots = scheduleSlots.filter((slot) => slot.weekday === weekday);
              if (daySlots.length === 0) return null;

              return (
                <div key={weekday} className="space-y-1">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">{scheduleLabels.weekdays[weekday]}</p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <div
                        key={`${slot.weekday}-${slot.startTime}`}
                        className="inline-flex items-center gap-2 rounded-md border border-[var(--surface-border)] px-2 py-1 text-xs"
                      >
                        <span>
                          {slot.startTime} - {computeEndTime(slot.startTime, durationMinutes)}
                        </span>
                        <button
                          type="button"
                          className="text-[var(--danger-fg)] hover:underline"
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
