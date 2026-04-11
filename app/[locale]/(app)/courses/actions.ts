"use server";

import { revalidatePath } from "next/cache";
import type { Weekday } from "@prisma/client";

import { requireAnyRole } from "@/lib/authorization";
import { sanitizeLessonTypeColor } from "@/lib/lesson-type-icons";
import { getLessonTypeIconOptions } from "@/lib/lesson-type-icons.server";
import { cancelFutureLessonsForDeletedCourse, reconcileFutureLessonsForCourse } from "@/lib/lessons";
import { prisma } from "@/lib/prisma";
import { parseOpenWeekdaysCsv } from "@/lib/site-settings";

type CourseMutationResult = {
  ok: boolean;
  message: string;
};

type LessonTypeMutationResult = {
  ok: boolean;
  message: string;
};

type ScheduleSlotInput = {
  weekday: Weekday;
  startTime: string;
};

function courseMessages(locale: string) {
  const isIt = locale === "it";

  return {
    nameRequired: isIt ? "Il nome e obbligatorio." : "Name is required.",
    numericInvalid: isIt ? "I campi numerici non sono validi." : "Numeric fields are invalid.",
    numericPositive:
      isIt ? "I campi numerici devono essere maggiori di 0." : "Numeric fields must be greater than 0.",
    scheduleRequired: isIt ? "Aggiungi almeno uno slot di schedulazione." : "Add at least one schedule slot.",
    scheduleInvalid: isIt ? "La schedulazione contiene dati non validi." : "Schedule contains invalid data.",
    scheduleOverlap:
      isIt
        ? "La schedulazione contiene lezioni sovrapposte nello stesso giorno."
        : "Schedule contains overlapping lessons on the same day.",
    scheduleClosedWeekday:
      isIt
        ? "La schedulazione contiene giorni attualmente chiusi dalla configurazione palestra."
        : "Schedule contains weekdays that are currently closed in site settings.",
    lessonTypeRequired: isIt ? "Seleziona un tipo lezione." : "Select a lesson type.",
    trainerForbidden:
      isIt ? "Come trainer puoi assegnare solo te stesso." : "As trainer you can only assign yourself.",
    trainerNotFound: isIt ? "Trainer non valido." : "Invalid trainer.",
    lessonTypeNotFound: isIt ? "Tipo lezione non trovato." : "Lesson type not found.",
    idRequired: isIt ? "Id corso obbligatorio." : "Course id is required.",
    created: isIt ? "Corso creato con successo." : "Course created successfully.",
    updated: isIt ? "Corso aggiornato con successo." : "Course updated successfully.",
    deleted: isIt ? "Corso eliminato con successo." : "Course deleted successfully.",
    restored: isIt ? "Corso ripristinato con successo." : "Course restored successfully.",
    createFailed: isIt ? "Impossibile creare il corso." : "Unable to create course.",
    updateFailed: isIt ? "Impossibile aggiornare il corso." : "Unable to update course.",
    deleteFailed: isIt ? "Impossibile eliminare il corso." : "Unable to delete course.",
    restoreFailed: isIt ? "Impossibile ripristinare il corso." : "Unable to restore course.",
    lessonTypeNameRequired: isIt ? "Il nome del tipo lezione e obbligatorio." : "Lesson type name is required.",
    lessonTypeIconRequired: isIt ? "L'icona SVG e obbligatoria." : "SVG icon is required.",
    lessonTypeIconInvalid: isIt ? "L'icona selezionata non e valida." : "Selected icon is not valid.",
    lessonTypeColorRequired: isIt ? "Il colore del tipo lezione e obbligatorio." : "Lesson type color is required.",
    lessonTypeColorInvalid: isIt ? "Il colore selezionato non e valido." : "Selected color is not valid.",
    lessonTypeCreated: isIt ? "Tipo lezione creato con successo." : "Lesson type created successfully.",
    lessonTypeUpdated: isIt ? "Tipo lezione aggiornato con successo." : "Lesson type updated successfully.",
    lessonTypeDeleted: isIt ? "Tipo lezione eliminato con successo." : "Lesson type deleted successfully.",
    lessonTypeCreateFailed: isIt ? "Impossibile creare il tipo lezione." : "Unable to create lesson type.",
    lessonTypeUpdateFailed: isIt ? "Impossibile aggiornare il tipo lezione." : "Unable to update lesson type.",
    lessonTypeDeleteFailed: isIt ? "Impossibile eliminare il tipo lezione." : "Unable to delete lesson type.",
    lessonTypeInUse:
      isIt
        ? "Impossibile eliminare: il tipo lezione e gia usato da corsi o lezioni."
        : "Cannot delete: lesson type is already used by courses or lessons.",
  };
}

const validWeekdays: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

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

function hasOverlappingScheduleSlots(slots: ScheduleSlotInput[], durationMinutes: number): boolean {
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

function parseScheduleSlots(formData: FormData, locale: string): ScheduleSlotInput[] {
  const messages = courseMessages(locale);
  const raw = getField(formData, "scheduleSlots");

  if (!raw) {
    throw new Error(messages.scheduleRequired);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(messages.scheduleInvalid);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(messages.scheduleRequired);
  }

  const unique = new Set<string>();
  const slots: ScheduleSlotInput[] = [];

  for (const item of parsed) {
    if (typeof item !== "object" || item === null) {
      throw new Error(messages.scheduleInvalid);
    }

    const weekday = (item as { weekday?: unknown }).weekday;
    const startTime = (item as { startTime?: unknown }).startTime;

    if (typeof weekday !== "string" || !validWeekdays.includes(weekday as Weekday)) {
      throw new Error(messages.scheduleInvalid);
    }

    if (typeof startTime !== "string" || !isValidTime(startTime)) {
      throw new Error(messages.scheduleInvalid);
    }

    const key = `${weekday}-${startTime}`;
    if (unique.has(key)) {
      throw new Error(messages.scheduleInvalid);
    }

    unique.add(key);
    slots.push({ weekday: weekday as Weekday, startTime });
  }

  return slots;
}

function getField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseIntField(formData: FormData, key: string): number {
  const raw = getField(formData, key);
  return Number.parseInt(raw, 10);
}

function validateCourseInput(formData: FormData, locale: string) {
  const messages = courseMessages(locale);
  const name = getField(formData, "name");
  const description = getField(formData, "description");
  const icon = getField(formData, "icon");
  const trainerName = getField(formData, "trainerName");
  const trainerId = getField(formData, "trainerId");
  const lessonTypeId = getField(formData, "lessonTypeId");
  const durationMinutes = parseIntField(formData, "durationMinutes");
  const maxAttendees = parseIntField(formData, "maxAttendees");
  const bookingAdvanceMonths = parseIntField(formData, "bookingAdvanceMonths");
  const cancellationWindowHours = parseIntField(formData, "cancellationWindowHours");

  if (!name) {
    throw new Error(messages.nameRequired);
  }

  if (
    Number.isNaN(durationMinutes) ||
    Number.isNaN(maxAttendees) ||
    Number.isNaN(bookingAdvanceMonths) ||
    Number.isNaN(cancellationWindowHours)
  ) {
    throw new Error(messages.numericInvalid);
  }

  if (durationMinutes <= 0 || maxAttendees <= 0 || bookingAdvanceMonths <= 0 || cancellationWindowHours <= 0) {
    throw new Error(messages.numericPositive);
  }

  if (!lessonTypeId) {
    throw new Error(messages.lessonTypeRequired);
  }

  const scheduleSlots = parseScheduleSlots(formData, locale);

  return {
    name,
    description: description || null,
    icon: icon || null,
    trainerName: trainerName || null,
    trainerId: trainerId || null,
    lessonTypeId,
    durationMinutes,
    maxAttendees,
    bookingAdvanceMonths,
    cancellationWindowHours,
    scheduleSlots,
  };
}

function getLocale(formData: FormData): string {
  const locale = getField(formData, "locale");
  return locale || "it";
}

function logCourseReconcile(message: string) {
  console.log(`[courses][reconcile] ${message}`);
}

export async function createCourseAction(formData: FormData): Promise<CourseMutationResult> {
  const locale = getLocale(formData);
  const messages = courseMessages(locale);

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const input = validateCourseInput(formData, locale);

    if (currentUser.role === "TRAINER" && input.trainerId && input.trainerId !== currentUser.id) {
      throw new Error(messages.trainerForbidden);
    }

    const [trainer, lessonType, siteSettings] = await Promise.all([
      input.trainerId
        ? prisma.user.findUnique({
            where: { id: input.trainerId },
            select: { id: true, name: true, role: true },
          })
        : Promise.resolve(null),
      prisma.lessonType.findUnique({ where: { id: input.lessonTypeId } }),
      prisma.siteSettings.findUnique({
        where: { id: 1 },
        select: { openWeekdaysCsv: true },
      }),
    ]);

    const siteOpenWeekdays = parseOpenWeekdaysCsv(siteSettings?.openWeekdaysCsv);
    const siteOpenWeekdaySet = new Set<Weekday>(siteOpenWeekdays as Weekday[]);
    if (input.scheduleSlots.some((slot) => !siteOpenWeekdaySet.has(slot.weekday))) {
      throw new Error(messages.scheduleClosedWeekday);
    }
    if (hasOverlappingScheduleSlots(input.scheduleSlots, input.durationMinutes)) {
      throw new Error(messages.scheduleOverlap);
    }

    if (trainer && trainer.role !== "TRAINER" && trainer.role !== "ADMIN") throw new Error(messages.trainerNotFound);
    if (!lessonType) throw new Error(messages.lessonTypeNotFound);

    const created = await prisma.course.create({
      data: {
        name: input.name,
        description: input.description,
        icon: null,
        trainerName: trainer?.name ?? null,
        trainerId: trainer?.id ?? null,
        lessonTypeId: lessonType.id,
        durationMinutes: input.durationMinutes,
        maxAttendees: input.maxAttendees,
        bookingAdvanceMonths: input.bookingAdvanceMonths,
        cancellationWindowHours: input.cancellationWindowHours,
        scheduleSlots: {
          create: input.scheduleSlots,
        },
      },
    });

    await prisma.$transaction(async (tx) => {
      await reconcileFutureLessonsForCourse(tx, created.id, {
        logger: logCourseReconcile,
        context: {
          trigger: "create-course",
          actorUserId: currentUser.id,
        },
      });
    });

    revalidatePath(`/${locale}/courses`);
    revalidatePath(`/${locale}/bookings`);

    return { ok: true, message: messages.created };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.createFailed,
    };
  }
}

export async function updateCourseAction(formData: FormData): Promise<CourseMutationResult> {
  const locale = getLocale(formData);
  const messages = courseMessages(locale);
  const id = getField(formData, "id");

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);

    if (!id) {
      throw new Error(messages.idRequired);
    }

    const input = validateCourseInput(formData, locale);

    if (currentUser.role === "TRAINER" && input.trainerId && input.trainerId !== currentUser.id) {
      throw new Error(messages.trainerForbidden);
    }

    const [trainer, lessonType, siteSettings] = await Promise.all([
      input.trainerId
        ? prisma.user.findUnique({
            where: { id: input.trainerId },
            select: { id: true, name: true, role: true },
          })
        : Promise.resolve(null),
      prisma.lessonType.findUnique({ where: { id: input.lessonTypeId } }),
      prisma.siteSettings.findUnique({
        where: { id: 1 },
        select: { openWeekdaysCsv: true },
      }),
    ]);

    const siteOpenWeekdays = parseOpenWeekdaysCsv(siteSettings?.openWeekdaysCsv);
    const siteOpenWeekdaySet = new Set<Weekday>(siteOpenWeekdays as Weekday[]);
    if (input.scheduleSlots.some((slot) => !siteOpenWeekdaySet.has(slot.weekday))) {
      throw new Error(messages.scheduleClosedWeekday);
    }
    if (hasOverlappingScheduleSlots(input.scheduleSlots, input.durationMinutes)) {
      throw new Error(messages.scheduleOverlap);
    }

    if (trainer && trainer.role !== "TRAINER" && trainer.role !== "ADMIN") throw new Error(messages.trainerNotFound);
    if (!lessonType) throw new Error(messages.lessonTypeNotFound);

    await prisma.$transaction(async (tx) => {
      await tx.courseScheduleSlot.deleteMany({ where: { courseId: id } });

      await tx.course.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          icon: null,
          trainerName: trainer?.name ?? null,
          trainerId: trainer?.id ?? null,
          lessonTypeId: lessonType.id,
          durationMinutes: input.durationMinutes,
          maxAttendees: input.maxAttendees,
          bookingAdvanceMonths: input.bookingAdvanceMonths,
          cancellationWindowHours: input.cancellationWindowHours,
          scheduleSlots: {
            create: input.scheduleSlots,
          },
        },
      });

      await reconcileFutureLessonsForCourse(tx, id, {
        logger: logCourseReconcile,
        context: {
          trigger: "update-course",
          actorUserId: currentUser.id,
        },
      });
    });
    revalidatePath(`/${locale}/courses`);
    revalidatePath(`/${locale}/bookings`);

    return { ok: true, message: messages.updated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.updateFailed,
    };
  }
}

export async function createLessonTypeAction(formData: FormData): Promise<LessonTypeMutationResult> {
  const locale = getLocale(formData);
  const messages = courseMessages(locale);

  try {
    await requireAnyRole(["ADMIN", "TRAINER"], locale);

    const name = getField(formData, "name");
    const description = getField(formData, "description");
    const iconSvg = getField(formData, "iconSvg");
    const colorHexRaw = getField(formData, "colorHex");

    if (!name) throw new Error(messages.lessonTypeNameRequired);
    if (!iconSvg) throw new Error(messages.lessonTypeIconRequired);
    if (!colorHexRaw) throw new Error(messages.lessonTypeColorRequired);

    const iconOptions = await getLessonTypeIconOptions();
    if (!iconOptions.includes(iconSvg)) throw new Error(messages.lessonTypeIconInvalid);
    const colorHex = sanitizeLessonTypeColor(colorHexRaw, "");
    if (!colorHex) throw new Error(messages.lessonTypeColorInvalid);

    await prisma.lessonType.create({
      data: {
        name,
        description: description || null,
        iconSvg,
        colorHex,
      },
    });

    revalidatePath(`/${locale}/courses`);
    revalidatePath(`/${locale}/settings/registries`);
    return { ok: true, message: messages.lessonTypeCreated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.lessonTypeCreateFailed,
    };
  }
}

export async function deleteLessonTypeAction(formData: FormData): Promise<LessonTypeMutationResult> {
  const locale = getLocale(formData);
  const messages = courseMessages(locale);

  try {
    await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const id = getField(formData, "id");
    if (!id) throw new Error(messages.idRequired);

    const [coursesUsingType, lessonsUsingType] = await Promise.all([
      prisma.course.count({ where: { lessonTypeId: id } }),
      prisma.lesson.count({ where: { lessonTypeId: id } }),
    ]);
    if (coursesUsingType > 0 || lessonsUsingType > 0) {
      throw new Error(messages.lessonTypeInUse);
    }

    await prisma.lessonType.delete({ where: { id } });

    revalidatePath(`/${locale}/courses`);
    revalidatePath(`/${locale}/settings/registries`);
    return { ok: true, message: messages.lessonTypeDeleted };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.lessonTypeDeleteFailed,
    };
  }
}

export async function updateLessonTypeAction(formData: FormData): Promise<LessonTypeMutationResult> {
  const locale = getLocale(formData);
  const messages = courseMessages(locale);

  try {
    await requireAnyRole(["ADMIN", "TRAINER"], locale);

    const id = getField(formData, "id");
    const name = getField(formData, "name");
    const description = getField(formData, "description");
    const iconSvg = getField(formData, "iconSvg");
    const colorHexRaw = getField(formData, "colorHex");

    if (!id) throw new Error(messages.idRequired);
    if (!name) throw new Error(messages.lessonTypeNameRequired);
    if (!iconSvg) throw new Error(messages.lessonTypeIconRequired);
    if (!colorHexRaw) throw new Error(messages.lessonTypeColorRequired);

    const iconOptions = await getLessonTypeIconOptions();
    if (!iconOptions.includes(iconSvg)) throw new Error(messages.lessonTypeIconInvalid);
    const colorHex = sanitizeLessonTypeColor(colorHexRaw, "");
    if (!colorHex) throw new Error(messages.lessonTypeColorInvalid);

    await prisma.lessonType.update({
      where: { id },
      data: {
        name,
        description: description || null,
        iconSvg,
        colorHex,
      },
    });

    revalidatePath(`/${locale}/courses`);
    revalidatePath(`/${locale}/settings/registries`);
    return { ok: true, message: messages.lessonTypeUpdated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.lessonTypeUpdateFailed,
    };
  }
}

export async function deleteCourseAction(formData: FormData): Promise<CourseMutationResult> {
  const locale = getLocale(formData);
  const messages = courseMessages(locale);
  const id = getField(formData, "id");
  const bookedFuturePolicy = getField(formData, "bookedFuturePolicy").toLowerCase();
  const cancelBookedLessons = bookedFuturePolicy === "cancel";

  try {
    await requireAnyRole(["ADMIN", "TRAINER"], locale);

    if (!id) {
      throw new Error(messages.idRequired);
    }

    await prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id }, select: { id: true, deletedAt: true } });
      if (!course) {
        throw new Error(messages.idRequired);
      }

      if (course.deletedAt) {
        return;
      }

      await cancelFutureLessonsForDeletedCourse(tx, id, {
        cancelBookedLessons,
      });
      await tx.course.update({ where: { id }, data: { deletedAt: new Date() } });
    });
    revalidatePath(`/${locale}/courses`);
    revalidatePath(`/${locale}/bookings`);
    revalidatePath(`/${locale}/lessons`);

    return { ok: true, message: messages.deleted };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.deleteFailed,
    };
  }
}

export async function restoreCourseAction(formData: FormData): Promise<CourseMutationResult> {
  const locale = getLocale(formData);
  const messages = courseMessages(locale);
  const id = getField(formData, "id");

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);

    if (!id) {
      throw new Error(messages.idRequired);
    }

    await prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id }, select: { id: true, deletedAt: true } });
      if (!course) {
        throw new Error(messages.idRequired);
      }

      if (!course.deletedAt) {
        return;
      }

      await tx.course.update({ where: { id }, data: { deletedAt: null } });
      await reconcileFutureLessonsForCourse(tx, id, {
        logger: logCourseReconcile,
        context: {
          trigger: "restore-course",
          actorUserId: currentUser.id,
        },
      });
    });

    revalidatePath(`/${locale}/courses`);
    revalidatePath(`/${locale}/bookings`);
    revalidatePath(`/${locale}/lessons`);

    return { ok: true, message: messages.restored };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.restoreFailed,
    };
  }
}
