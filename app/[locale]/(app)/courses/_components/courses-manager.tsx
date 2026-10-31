"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Pencil, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";

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
import { cn } from "@/lib/utils";
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
      const trainerName = course.trainer?.name ?? course.trainerName ?? "";
      if (trainerFilter === "with" && !trainerName) return false;
      if (trainerFilter === "without" && trainerName) return false;

      if (!query) return true;

      const byName = course.name.toLowerCase().includes(query);
      const byTrainer = trainerName.toLowerCase().includes(query);
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

  const trainerFilters: Array<[typeof trainerFilter, string]> = [
    ["all", labels.filterAll],
    ["with", labels.filterWithTrainer],
    ["without", labels.filterWithoutTrainer],
  ];
  const weekdayOrderForGrid = weekdayOrder.filter((day) => availableWeekdays.includes(day));

  return (
    <div>
      <div
        data-page-band
        className="-mt-4 bg-[var(--stock)] pb-5 pt-1 shadow-[0_0_0_100vmax_var(--stock)] [clip-path:inset(0_-100vmax)] lg:-mt-10 lg:pb-6 lg:pt-10"
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.375rem] font-bold leading-tight lg:text-[2rem]">{labels.title}</h1>
            <p className="mt-1 text-[15px] text-[var(--stock-ink)]/75">{labels.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {currentUser.role === "ADMIN" ? (
              <a
                href={`/${locale}/courses${includeDeleted ? "" : "?showDeleted=1"}`}
                aria-current={includeDeleted ? "true" : undefined}
                className={cn(
                  "hidden h-11 items-center gap-1.5 rounded-xl border-[1.5px] px-3.5 text-[15px] font-semibold transition-colors sm:inline-flex",
                  includeDeleted
                    ? "border-[var(--foreground)] bg-[var(--surface)]"
                    : "border-[var(--stock-edge)] text-[var(--stock-ink)]/80 hover:bg-[var(--surface)]/60"
                )}
              >
                {includeDeleted ? <Check size={16} aria-hidden="true" /> : null}
                {labels.showDeletedCta}
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
                <Button aria-label={labels.createCta} className="w-11 px-0 sm:w-auto sm:px-4">
                  <Plus size={18} aria-hidden="true" />
                  <span className="hidden sm:inline">{labels.createCta}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>{labels.createTitle}</DialogTitle>
                <DialogDescription>{labels.createDescription}</DialogDescription>
              </DialogHeader>

              <div role="group" className="inline-flex rounded-xl bg-[var(--muted)] p-1">
                <button
                  type="button"
                  onClick={() => setCreateTab("main")}
                  className={[
                    "h-11 rounded-lg px-4 text-[15px] font-semibold transition-colors",
                    createTab === "main"
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  ].join(" ")}
                >
                  {labels.tabs.main}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateTab("schedule")}
                  className={[
                    "h-11 rounded-lg px-4 text-[15px] font-semibold transition-colors",
                    createTab === "schedule"
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
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
                  disableTrainerSelection={currentUser.role === "TRAINER"}
                  fixedTrainerId={currentUser.id}
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
        </header>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.searchPlaceholder}
              aria-label={labels.searchPlaceholder}
              className="pl-10"
            />
          </div>
          <div role="group" aria-label={labels.columns.trainer} className="inline-flex w-fit rounded-xl bg-[var(--surface)]/70 p-1">
            {trainerFilters.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={trainerFilter === value}
                onClick={() => setTrainerFilter(value)}
                className={cn(
                  "h-11 rounded-lg px-3.5 text-[15px] font-semibold transition-colors",
                  trainerFilter === value
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
                    : "text-[var(--stock-ink)]/75 hover:text-[var(--foreground)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <p className="pt-6 text-[15px] text-[var(--muted-foreground)]">{labels.empty}</p>
      ) : (
        <ul className="-mx-4 pt-2 sm:mx-0">
          {filteredCourses.map((course) => {
            const trainerName = course.trainer?.name ?? course.trainerName ?? null;
            const slotsByDay = new Map<Weekday, string[]>();
            for (const slot of normalizeScheduleSlots(course.scheduleSlots)) {
              slotsByDay.set(slot.weekday, [...(slotsByDay.get(slot.weekday) ?? []), slot.startTime]);
            }
            return (
              <li
                key={course.id}
                className="grid gap-x-6 gap-y-3 border-b border-[var(--rule)] px-4 py-5 last:border-b-0 sm:px-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      "flex items-start gap-2 text-[17px] font-semibold leading-snug",
                      course.deletedAt ? "text-[var(--muted-foreground)] line-through decoration-1" : ""
                    )}
                  >
                    {course.lessonType ? (
                      <LessonTypeIcon iconPath={course.lessonType.iconSvg} colorHex={course.lessonType.colorHex} size={18} className="mt-[3px]" />
                    ) : null}
                    <span className="min-w-0 break-words">{course.name}</span>
                  </p>
                  <p className="mt-0.5 text-[15px] text-[var(--muted-foreground)]">
                    {[course.lessonType?.name, trainerName ?? labels.filterWithoutTrainer].filter(Boolean).join(" · ")}
                  </p>
                  <p className="tabular mt-1 text-sm text-[var(--muted-foreground)]">
                    {course.durationMinutes} min · {labels.columns.maxAttendees} {course.maxAttendees}
                  </p>
                  {course.deletedAt ? (
                    <span className="mt-2 inline-block rounded-lg bg-[var(--danger-bg)] px-2 py-0.5 text-[13px] font-semibold text-[var(--danger-fg)]">
                      {labels.deletedTag}
                    </span>
                  ) : null}
                </div>

                {/* The course's week, set like a printed timetable: one column per open day. */}
                <div
                  aria-label={labels.columns.schedule}
                  role="group"
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${Math.max(1, weekdayOrderForGrid.length)}, minmax(0, 1fr))` }}
                >
                  {weekdayOrderForGrid.map((day) => {
                    const times = slotsByDay.get(day) ?? [];
                    return (
                      <div key={day} className="min-w-0 text-center">
                        <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                          {labels.schedule.weekdays[day].slice(0, 3)}
                        </p>
                        <div className="mt-1 space-y-1">
                          {times.length === 0 ? (
                            <span aria-hidden="true" className="block h-7 rounded-md border border-dashed border-[var(--rule)]" />
                          ) : (
                            times.map((time) => (
                              <span
                                key={time}
                                className="tabular block rounded-md bg-[var(--stock-giallino)] py-1 text-[13px] font-bold text-[var(--stock-ink)]"
                              >
                                {time}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1 lg:justify-end">
                  {course.deletedAt && course.canManage ? (
                    <Button variant="outline" onClick={() => restoreCourse(course.id)} disabled={isPending}>
                      <RotateCcw size={16} aria-hidden="true" />
                      {labels.actions.restore}
                    </Button>
                  ) : !course.deletedAt && course.canManage ? (
                    <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedCourse(course);
                          setEditSchedule(normalizeScheduleSlots(course.scheduleSlots));
                          setEditTab("main");
                          setEditOpen(true);
                        }}
                      >
                        <Pencil size={16} aria-hidden="true" />
                        {labels.actions.edit}
                      </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

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
              <div role="group" className="inline-flex rounded-xl bg-[var(--muted)] p-1">
                <button
                  type="button"
                  onClick={() => setEditTab("main")}
                  className={[
                    "h-11 rounded-lg px-4 text-[15px] font-semibold transition-colors",
                    editTab === "main"
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  ].join(" ")}
                >
                  {labels.tabs.main}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab("schedule")}
                  className={[
                    "h-11 rounded-lg px-4 text-[15px] font-semibold transition-colors",
                    editTab === "schedule"
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-lift)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
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
                disableTrainerSelection={currentUser.role === "TRAINER"}
                fixedTrainerId={currentUser.id}
                onAddSlot={(weekday, startTime) => addScheduleSlot("edit", weekday, startTime)}
                onRemoveSlot={(weekday, startTime) => removeScheduleSlot("edit", weekday, startTime)}
              />
              <DialogFooter>
                {/* Deleting is deliberate: it lives here, away from the list. */}
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)] sm:mr-auto"
                  onClick={() => {
                    setEditOpen(false);
                    askDeleteConfirmation(selectedCourse.id, selectedCourse.name, selectedCourse.futureBookedLessonsCount);
                  }}
                >
                  <Trash2 size={18} aria-hidden="true" />
                  {labels.actions.delete}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                  {labels.actions.cancel}
                </Button>
                <Button type="submit">
                  <Pencil size={16} aria-hidden="true" />
                  {labels.reviewUpdate}
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
    </div>
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
  disableTrainerSelection = false,
  fixedTrainerId,
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
  disableTrainerSelection?: boolean;
  fixedTrainerId?: string;
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
            className="ui-select w-full"
          >
            <option value="">-</option>
            {lessonTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {selectedLessonType ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--surface-sunken)] px-2.5 py-1.5">
              <LessonTypeIcon
                iconPath={selectedLessonType.iconSvg}
                colorHex={selectedLessonType.colorHex}
                size={22}
                title={selectedLessonType.name}
              />
              <span className="text-sm text-[var(--muted-foreground)]">{selectedLessonType.name}</span>
            </div>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="trainerId">{labels.trainer}</Label>
          {disableTrainerSelection ? <input type="hidden" name="trainerId" value={fixedTrainerId ?? defaultValues.trainerId} /> : null}
          <select
            id="trainerId"
            name="trainerId"
            defaultValue={defaultValues.trainerId}
            disabled={disableTrainerSelection}
            className="ui-select w-full"
          >
            <option value="">-</option>
            {trainerCandidates.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
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

      <div className={activeTab === "schedule" ? "space-y-4" : "hidden"}>
        <div>
          <p className="text-[15px] font-semibold">{scheduleLabels.title}</p>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{scheduleLabels.description}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={safeDayToAdd}
            onChange={(event) => setDayToAdd(event.target.value as Weekday)}
            className="ui-select"
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
          <p className="text-[15px] text-[var(--muted-foreground)]">{scheduleLabels.noSlots}</p>
        ) : (
          <div className="space-y-2">
            {weekdayOrder.map((weekday) => {
              const daySlots = scheduleSlots.filter((slot) => slot.weekday === weekday);
              if (daySlots.length === 0) return null;

              return (
                <div key={weekday} className="space-y-1">
                  <p className="text-sm font-semibold">{scheduleLabels.weekdays[weekday]}</p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <div
                        key={`${slot.weekday}-${slot.startTime}`}
                        className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-[var(--stock-giallino)] pl-3 text-[15px] font-semibold text-[var(--stock-ink)]"
                      >
                        <span className="tabular">
                          {slot.startTime}–{computeEndTime(slot.startTime, durationMinutes)}
                        </span>
                        <button
                          type="button"
                          aria-label={`${scheduleLabels.removeSlot} ${scheduleLabels.weekdays[weekday]} ${slot.startTime}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--danger-fg)] transition-colors hover:bg-[var(--danger-bg)]"
                          onClick={() => onRemoveSlot(slot.weekday, slot.startTime)}
                        >
                          <X size={16} aria-hidden="true" />
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
