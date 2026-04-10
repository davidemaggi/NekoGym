"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { requireAnyRole } from "@/lib/authorization";
import { isLessonAllowedBySiteSchedule } from "@/lib/lessons";
import { prisma } from "@/lib/prisma";
import { parseClosedDatesCsv, parseOpenWeekdaysCsv } from "@/lib/site-settings";
import { enqueueNotificationForUsers } from "@/server/outbox/queue";

type LessonMutationResult = {
  ok: boolean;
  message: string;
};

function getField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function messages(locale: string) {
  const isIt = locale === "it";
  return {
    lessonRequired: isIt ? "Lezione non valida." : "Invalid lesson.",
    standaloneOnly: isIt ? "Puoi modificare solo lezioni non collegate a un corso." : "Only standalone lessons can be changed.",
    startsAtRequired: isIt ? "Data/ora inizio obbligatoria." : "Start date/time is required.",
    numericInvalid: isIt ? "Campi numerici non validi." : "Numeric fields are invalid.",
    trainerInvalid: isIt ? "Trainer non valido." : "Invalid trainer.",
    trainerForbidden: isIt ? "Come trainer puoi assegnare solo te stesso." : "As trainer you can only assign yourself.",
    lessonTypeInvalid: isIt ? "Tipo lezione non valido." : "Invalid lesson type.",
    closedBySchedule:
      isIt
        ? "La palestra e chiusa nella data selezionata."
        : "The gym is closed on the selected date.",
    lessonUnavailable: isIt ? "Lezione non disponibile." : "Lesson is not available.",
    staffForbidden: isIt ? "Non puoi gestire questa lezione." : "You cannot manage this lesson.",
    attendeeRequired: isIt ? "Utente non valido." : "Invalid user.",
    attendeeNotFound: isIt ? "Utente non trovato." : "User not found.",
    attendeeExists: isIt ? "Utente gia iscritto a questa lezione." : "User already booked for this lesson.",
    attendeeMissing: isIt ? "Utente non iscritto a questa lezione." : "User is not booked for this lesson.",
    lessonFull: isIt ? "Lezione piena." : "Lesson is full.",
    sameCourseDay: isIt ? "Utente gia iscritto a questo corso nello stesso giorno." : "User already booked this course on the same day.",
    standaloneCreated: isIt ? "Lezione creata." : "Lesson created.",
    standaloneUpdated: isIt ? "Lezione aggiornata." : "Lesson updated.",
    lessonMainUpdated: isIt ? "Dettagli lezione aggiornati." : "Lesson details updated.",
    trainerUpdated: isIt ? "Trainer aggiornato." : "Trainer updated.",
    attendeeAdded: isIt ? "Iscritto aggiunto." : "Attendee added.",
    attendeeRemoved: isIt ? "Iscritto rimosso." : "Attendee removed.",
    failed: isIt ? "Impossibile creare la lezione." : "Unable to create lesson.",
    updateFailed: isIt ? "Impossibile aggiornare la lezione." : "Unable to update lesson.",
    mainUpdateFailed: isIt ? "Impossibile aggiornare i dettagli lezione." : "Unable to update lesson details.",
    trainerUpdateFailed: isIt ? "Impossibile aggiornare il trainer." : "Unable to update trainer.",
    attendeeAddFailed: isIt ? "Impossibile aggiungere iscritto." : "Unable to add attendee.",
    attendeeRemoveFailed: isIt ? "Impossibile rimuovere iscritto." : "Unable to remove attendee.",
    pastLocked:
      isIt
        ? "Lezioni passate o in corso non modificabili (solo gestione partecipanti)."
        : "Past or ongoing lessons are read-only (attendees management only).",
    alreadyQueued: isIt ? "Utente gia in coda per questa lezione." : "User is already queued for this lesson.",
    queueMissing: isIt ? "Utente non presente in coda." : "User is not in waitlist.",
    queueConfirmed: isIt ? "Utente confermato dalla coda." : "User confirmed from waitlist.",
    queueRemoved: isIt ? "Utente rimosso dalla coda." : "User removed from waitlist.",
    queueConfirmFailed: isIt ? "Impossibile confermare utente dalla coda." : "Unable to confirm user from waitlist.",
    queueRemoveFailed: isIt ? "Impossibile rimuovere utente dalla coda." : "Unable to remove user from waitlist.",
  };
}

function isPastOrNow(startsAt: Date): boolean {
  return startsAt.getTime() <= Date.now();
}

function parsePositiveInt(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value <= 0) return null;
  return value;
}

function parseStartsAt(raw: string, locale: string): Date {
  const t = messages(locale);
  if (!raw) throw new Error(t.startsAtRequired);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error(t.startsAtRequired);
  return date;
}

async function validateStartsAtBySiteSchedule(input: {
  tx: Prisma.TransactionClient;
  startsAt: Date;
  locale: string;
}) {
  const settings = await input.tx.siteSettings.findUnique({
    where: { id: 1 },
    select: { openWeekdaysCsv: true, closedDatesCsv: true },
  });
  const openWeekdays = parseOpenWeekdaysCsv(settings?.openWeekdaysCsv);
  const closedDates = parseClosedDatesCsv(settings?.closedDatesCsv);
  if (!isLessonAllowedBySiteSchedule(input.startsAt, openWeekdays, closedDates)) {
    throw new Error(messages(input.locale).closedBySchedule);
  }
}

async function validateTrainer(input: {
  tx: Prisma.TransactionClient;
  locale: string;
  trainerId: string | null;
  currentUser: { id: string; role: "ADMIN" | "TRAINER" | "TRAINEE" };
}) {
  const t = messages(input.locale);
  if (!input.trainerId) return;

  if (input.currentUser.role === "TRAINER" && input.trainerId !== input.currentUser.id) {
    throw new Error(t.trainerForbidden);
  }

  const trainer = await input.tx.user.findUnique({
    where: { id: input.trainerId },
    select: { role: true },
  });

  if (!trainer || (trainer.role !== "TRAINER" && trainer.role !== "ADMIN")) {
    throw new Error(t.trainerInvalid);
  }
}

async function validateLessonType(tx: Prisma.TransactionClient, lessonTypeId: string | null, locale: string) {
  const t = messages(locale);
  if (!lessonTypeId) return;

  const lessonType = await tx.lessonType.findUnique({
    where: { id: lessonTypeId },
    select: { id: true },
  });

  if (!lessonType) {
    throw new Error(t.lessonTypeInvalid);
  }
}

function formatDateForNotification(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function enqueueStandaloneLessonUpdatedNotification(input: {
  tx: Prisma.TransactionClient;
  locale: string;
  lessonId: string;
  startsAt: Date;
  trainerId: string | null;
}) {
  const bookings = await input.tx.lessonBooking.findMany({
    where: { lessonId: input.lessonId },
    select: {
      trainee: {
        select: {
          id: true,
          telegramChatId: true,
        },
      },
    },
  });

  const targetMap = new Map<string, { id: string; telegramChatId: string | null }>();
  for (const booking of bookings) {
    targetMap.set(booking.trainee.id, {
      id: booking.trainee.id,
      telegramChatId: booking.trainee.telegramChatId,
    });
  }

  if (input.trainerId) {
    const trainer = await input.tx.user.findUnique({
      where: { id: input.trainerId },
      select: { id: true, telegramChatId: true },
    });
    if (trainer) {
      targetMap.set(trainer.id, { id: trainer.id, telegramChatId: trainer.telegramChatId });
    }
  }

  const targets = Array.from(targetMap.values());
  if (targets.length === 0) return;

  await enqueueNotificationForUsers(input.tx, targets, {
    subject: input.locale === "it" ? "Lezione aggiornata" : "Lesson updated",
    body:
      input.locale === "it"
        ? `La lezione del ${formatDateForNotification(input.startsAt, input.locale)} e stata modificata.`
        : `Lesson on ${formatDateForNotification(input.startsAt, input.locale)} has been updated.`,
  });
}

async function loadManagedLessonOrThrow(input: {
  tx: Prisma.TransactionClient;
  lessonId: string;
  locale: string;
  currentUser: { id: string; role: "ADMIN" | "TRAINER" | "TRAINEE" };
}) {
  const t = messages(input.locale);
  const lesson = await input.tx.lesson.findUnique({
    where: { id: input.lessonId },
    include: {
      course: { select: { name: true, trainerId: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!lesson) {
    throw new Error(t.lessonRequired);
  }

  if (lesson.deletedAt) {
    throw new Error(t.lessonUnavailable);
  }

  if (input.currentUser.role === "TRAINER" && lesson.trainerId !== input.currentUser.id) {
    throw new Error(t.staffForbidden);
  }

  return lesson;
}

async function enqueueAttendeeChangedNotification(input: {
  tx: Prisma.TransactionClient;
  locale: string;
  action: "ADDED" | "REMOVED";
  actorName: string;
  attendee: { id: string; name: string; telegramChatId: string | null };
  lesson: { startsAt: Date; trainerId: string | null; course: { name: string } | null };
}) {
  const targetMap = new Map<string, { id: string; telegramChatId: string | null }>();
  targetMap.set(input.attendee.id, { id: input.attendee.id, telegramChatId: input.attendee.telegramChatId });

  if (input.lesson.trainerId) {
    const trainer = await input.tx.user.findUnique({
      where: { id: input.lesson.trainerId },
      select: { id: true, telegramChatId: true },
    });
    if (trainer) {
      targetMap.set(trainer.id, { id: trainer.id, telegramChatId: trainer.telegramChatId });
    }
  }

  const targets = Array.from(targetMap.values());
  if (targets.length === 0) return;

  const isIt = input.locale === "it";
  const actionText = input.action === "ADDED"
    ? (isIt ? "aggiunto" : "added")
    : (isIt ? "rimosso" : "removed");
  const subject = isIt ? "Aggiornamento iscritti lezione" : "Lesson attendees update";
  const body = isIt
    ? `${input.actorName} ha ${actionText} ${input.attendee.name} alla lezione ${input.lesson.course?.name ?? "-"} del ${formatDateForNotification(input.lesson.startsAt, input.locale)}.`
    : `${input.actorName} ${actionText} ${input.attendee.name} for lesson ${input.lesson.course?.name ?? "-"} on ${formatDateForNotification(input.lesson.startsAt, input.locale)}.`;

  await enqueueNotificationForUsers(input.tx, targets, { subject, body });
}

async function notifyWaitlistSeatAvailable(input: {
  tx: Prisma.TransactionClient;
  locale: string;
  lessonId: string;
  startsAt: Date;
  courseName: string | null;
}) {
  const queued = await input.tx.lessonWaitlistEntry.findMany({
    where: { lessonId: input.lessonId },
    select: {
      trainee: {
        select: { id: true, telegramChatId: true },
      },
    },
  });

  if (queued.length === 0) return;

  await enqueueNotificationForUsers(
    input.tx,
    queued.map((entry) => ({ id: entry.trainee.id, telegramChatId: entry.trainee.telegramChatId })),
    {
      subject: input.locale === "it" ? "Posto libero in lezione" : "Seat available in lesson",
      body:
        input.locale === "it"
          ? `Si e liberato un posto per la lezione ${input.courseName ?? "-"} del ${formatDateForNotification(input.startsAt, input.locale)}.`
          : `A seat is now available for lesson ${input.courseName ?? "-"} on ${formatDateForNotification(input.startsAt, input.locale)}.`,
    }
  );
}

export async function createStandaloneLessonMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const user = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const startsAt = parseStartsAt(getField(formData, "startsAt"), locale);
    const durationMinutes = parsePositiveInt(getField(formData, "durationMinutes"));
    const maxAttendees = parsePositiveInt(getField(formData, "maxAttendees"));
    const cancellationWindowHours = parsePositiveInt(getField(formData, "cancellationWindowHours"));
    const trainerId = getField(formData, "trainerId") || null;
    const lessonTypeId = getField(formData, "lessonTypeId") || null;
    const title = getField(formData, "title") || null;
    const description = getField(formData, "description") || null;

    if (!durationMinutes || !maxAttendees || !cancellationWindowHours) {
      throw new Error(t.numericInvalid);
    }

    await prisma.$transaction(async (tx) => {
      await validateStartsAtBySiteSchedule({ tx, startsAt, locale });
      await validateTrainer({ tx, locale, trainerId, currentUser: user });
      await validateLessonType(tx, lessonTypeId, locale);

      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
      await tx.lesson.create({
        data: {
          title,
          description,
          startsAt,
          endsAt,
          maxAttendees,
          cancellationWindowHours,
          trainerId,
          lessonTypeId,
          status: "SCHEDULED",
          isGenerated: false,
          isCustomized: false,
        },
      });
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
    return { ok: true, message: t.standaloneCreated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.failed,
    };
  }
}

export async function updateStandaloneLessonMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const user = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const lessonId = getField(formData, "lessonId");
    if (!lessonId) throw new Error(t.lessonRequired);

    const startsAt = parseStartsAt(getField(formData, "startsAt"), locale);
    const durationMinutes = parsePositiveInt(getField(formData, "durationMinutes"));
    const maxAttendees = parsePositiveInt(getField(formData, "maxAttendees"));
    const cancellationWindowHours = parsePositiveInt(getField(formData, "cancellationWindowHours"));
    const trainerId = getField(formData, "trainerId") || null;
    const lessonTypeId = getField(formData, "lessonTypeId") || null;
    const title = getField(formData, "title") || null;
    const description = getField(formData, "description") || null;

    if (!durationMinutes || !maxAttendees || !cancellationWindowHours) {
      throw new Error(t.numericInvalid);
    }

    await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        include: {
          bookings: { select: { id: true } },
        },
      });

      if (!lesson) throw new Error(t.lessonRequired);
      if (lesson.deletedAt) throw new Error(t.lessonUnavailable);
      if (lesson.courseId) throw new Error(t.standaloneOnly);

      await validateStartsAtBySiteSchedule({ tx, startsAt, locale });
      await validateTrainer({ tx, locale, trainerId, currentUser: user });
      await validateLessonType(tx, lessonTypeId, locale);

      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
      const hasMeaningfulChange =
        lesson.title !== title ||
        lesson.description !== description ||
        lesson.startsAt.getTime() !== startsAt.getTime() ||
        lesson.endsAt.getTime() !== endsAt.getTime() ||
        lesson.trainerId !== trainerId;

      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          title,
          description,
          startsAt,
          endsAt,
          maxAttendees,
          cancellationWindowHours,
          trainerId,
          lessonTypeId,
          isCustomized: hasMeaningfulChange,
        },
      });

      if (lesson.bookings.length > 0 && hasMeaningfulChange) {
        await enqueueStandaloneLessonUpdatedNotification({
          tx,
          locale,
          lessonId,
          startsAt,
          trainerId,
        });
      }
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
    return { ok: true, message: t.standaloneUpdated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.updateFailed,
    };
  }
}

export async function updateLessonMainMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const lessonId = getField(formData, "lessonId");
    if (!lessonId) throw new Error(t.lessonRequired);

    const startsAt = parseStartsAt(getField(formData, "startsAt"), locale);
    const durationMinutes = parsePositiveInt(getField(formData, "durationMinutes"));
    const maxAttendees = parsePositiveInt(getField(formData, "maxAttendees"));
    const cancellationWindowHours = parsePositiveInt(getField(formData, "cancellationWindowHours"));
    const lessonTypeId = getField(formData, "lessonTypeId") || null;
    const title = getField(formData, "title") || null;
    const description = getField(formData, "description") || null;

    if (!durationMinutes || !maxAttendees || !cancellationWindowHours) {
      throw new Error(t.numericInvalid);
    }

    await prisma.$transaction(async (tx) => {
      const lesson = await loadManagedLessonOrThrow({
        tx,
        lessonId,
        locale,
        currentUser,
      });

      if (lesson.courseId) {
        throw new Error(t.standaloneOnly);
      }

      if (isPastOrNow(lesson.startsAt)) {
        throw new Error(t.pastLocked);
      }

      await validateStartsAtBySiteSchedule({ tx, startsAt, locale });
      await validateLessonType(tx, lessonTypeId, locale);

      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
      const hasMeaningfulChange =
        lesson.title !== title ||
        lesson.description !== description ||
        lesson.startsAt.getTime() !== startsAt.getTime() ||
        lesson.endsAt.getTime() !== endsAt.getTime() ||
        lesson.maxAttendees !== maxAttendees ||
        lesson.cancellationWindowHours !== cancellationWindowHours ||
        lesson.lessonTypeId !== lessonTypeId;

      const isCustomized = lesson.course
        ? hasMeaningfulChange || lesson.trainerId !== lesson.course.trainerId
        : hasMeaningfulChange;

      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          title,
          description,
          startsAt,
          endsAt,
          maxAttendees,
          cancellationWindowHours,
          lessonTypeId,
          isCustomized,
        },
      });

      if (lesson._count.bookings > 0 && hasMeaningfulChange) {
        await enqueueStandaloneLessonUpdatedNotification({
          tx,
          locale,
          lessonId,
          startsAt,
          trainerId: lesson.trainerId,
        });
      }
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
    return { ok: true, message: t.lessonMainUpdated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.mainUpdateFailed,
    };
  }
}

export async function updateLessonTrainerMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const user = await requireAnyRole(["ADMIN"], locale);
    const lessonId = getField(formData, "lessonId");
    const trainerId = getField(formData, "trainerId") || null;
    if (!lessonId) throw new Error(t.lessonRequired);

    await prisma.$transaction(async (tx) => {
      await validateTrainer({ tx, locale, trainerId, currentUser: user });

      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        include: {
          course: {
            select: { trainerId: true, name: true },
          },
        },
      });

      if (!lesson) {
        throw new Error(t.lessonRequired);
      }

      if (isPastOrNow(lesson.startsAt)) {
        throw new Error(t.pastLocked);
      }

      const isCustomized = lesson.course ? trainerId !== lesson.course.trainerId : false;

      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          trainerId,
          isCustomized,
        },
      });

      await enqueueStandaloneLessonUpdatedNotification({
        tx,
        locale,
        lessonId: lesson.id,
        startsAt: lesson.startsAt,
        trainerId,
      });
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
    return { ok: true, message: t.trainerUpdated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.trainerUpdateFailed,
    };
  }
}

export async function addLessonAttendeeMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const lessonId = getField(formData, "lessonId");
    const attendeeId = getField(formData, "attendeeId");
    if (!lessonId) throw new Error(t.lessonRequired);
    if (!attendeeId) throw new Error(t.attendeeRequired);

    await prisma.$transaction(async (tx) => {
      const lesson = await loadManagedLessonOrThrow({ tx, lessonId, locale, currentUser });
      const pastOrNow = isPastOrNow(lesson.startsAt);
      if (!pastOrNow && lesson.status !== "SCHEDULED") throw new Error(t.lessonUnavailable);

      const attendee = await tx.user.findUnique({ where: { id: attendeeId }, select: { id: true, name: true, telegramChatId: true } });
      if (!attendee) throw new Error(t.attendeeNotFound);

      const existing = await tx.lessonBooking.findUnique({
        where: {
          lessonId_traineeId: {
            lessonId,
            traineeId: attendeeId,
          },
        },
      });
      if (existing) throw new Error(t.attendeeExists);

      if (lesson._count.bookings >= lesson.maxAttendees) throw new Error(t.lessonFull);

      if (lesson.courseId) {
        const startOfDay = new Date(lesson.startsAt);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const sameCourseDay = await tx.lessonBooking.findFirst({
          where: {
            traineeId: attendeeId,
            lesson: {
              courseId: lesson.courseId,
              startsAt: { gte: startOfDay, lt: endOfDay },
              status: "SCHEDULED",
              deletedAt: null,
            },
          },
        });

        if (sameCourseDay) throw new Error(t.sameCourseDay);
      }

      await tx.lessonBooking.create({
        data: {
          lessonId,
          traineeId: attendeeId,
        },
      });

      if (!pastOrNow) {
        await enqueueAttendeeChangedNotification({
          tx,
          locale,
          action: "ADDED",
          actorName: currentUser.name,
          attendee,
          lesson,
        });
      }
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
    return { ok: true, message: t.attendeeAdded };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.attendeeAddFailed,
    };
  }
}

export async function removeLessonAttendeeMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const lessonId = getField(formData, "lessonId");
    const attendeeId = getField(formData, "attendeeId");
    if (!lessonId) throw new Error(t.lessonRequired);
    if (!attendeeId) throw new Error(t.attendeeRequired);

    await prisma.$transaction(async (tx) => {
      const lesson = await loadManagedLessonOrThrow({ tx, lessonId, locale, currentUser });
      const pastOrNow = isPastOrNow(lesson.startsAt);

      const booking = await tx.lessonBooking.findUnique({
        where: {
          lessonId_traineeId: {
            lessonId,
            traineeId: attendeeId,
          },
        },
        select: {
          id: true,
          trainee: {
            select: { id: true, name: true, telegramChatId: true },
          },
        },
      });

      if (!booking) throw new Error(t.attendeeMissing);

      await tx.lessonBooking.delete({ where: { id: booking.id } });

      const remainingBookings = await tx.lessonBooking.count({ where: { lessonId } });

      if (!pastOrNow) {
        await enqueueAttendeeChangedNotification({
          tx,
          locale,
          action: "REMOVED",
          actorName: currentUser.name,
          attendee: booking.trainee,
          lesson,
        });

        if (remainingBookings < lesson.maxAttendees) {
          await notifyWaitlistSeatAvailable({
            tx,
            locale,
            lessonId,
            startsAt: lesson.startsAt,
            courseName: lesson.course?.name ?? null,
          });
        }

        const msUntilStart = lesson.startsAt.getTime() - Date.now();
        const noticeMs = lesson.cancellationWindowHours * 60 * 60 * 1000;
        if (remainingBookings === 0 && lesson.startsAt > new Date() && msUntilStart <= noticeMs) {
          await tx.lesson.update({
            where: { id: lessonId },
            data: { status: "CANCELLED", deletedAt: new Date() },
          });
        }
      }
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
    return { ok: true, message: t.attendeeRemoved };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.attendeeRemoveFailed,
    };
  }
}

export async function confirmLessonWaitlistEntryMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const lessonId = getField(formData, "lessonId");
    const attendeeId = getField(formData, "attendeeId");
    if (!lessonId) throw new Error(t.lessonRequired);
    if (!attendeeId) throw new Error(t.attendeeRequired);

    await prisma.$transaction(async (tx) => {
      const lesson = await loadManagedLessonOrThrow({ tx, lessonId, locale, currentUser });
      if (lesson.status !== "SCHEDULED") throw new Error(t.lessonUnavailable);
      if (lesson.startsAt <= new Date()) throw new Error(t.lessonUnavailable);

      const waitlistEntry = await tx.lessonWaitlistEntry.findUnique({
        where: {
          lessonId_traineeId: {
            lessonId,
            traineeId: attendeeId,
          },
        },
      });
      if (!waitlistEntry) throw new Error(t.queueMissing);

      const existingBooking = await tx.lessonBooking.findUnique({
        where: {
          lessonId_traineeId: {
            lessonId,
            traineeId: attendeeId,
          },
        },
      });
      if (existingBooking) {
        await tx.lessonWaitlistEntry.delete({ where: { id: waitlistEntry.id } });
        throw new Error(t.attendeeExists);
      }

      if (lesson._count.bookings >= lesson.maxAttendees) throw new Error(t.lessonFull);

      const attendee = await tx.user.findUnique({ where: { id: attendeeId }, select: { id: true, name: true, telegramChatId: true } });
      if (!attendee) throw new Error(t.attendeeNotFound);

      await tx.lessonBooking.create({
        data: {
          lessonId,
          traineeId: attendeeId,
        },
      });
      await tx.lessonWaitlistEntry.delete({ where: { id: waitlistEntry.id } });

      await enqueueAttendeeChangedNotification({
        tx,
        locale,
        action: "ADDED",
        actorName: currentUser.name,
        attendee,
        lesson,
      });
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
    return { ok: true, message: t.queueConfirmed };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.queueConfirmFailed,
    };
  }
}

export async function removeLessonWaitlistEntryMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const lessonId = getField(formData, "lessonId");
    const attendeeId = getField(formData, "attendeeId");
    if (!lessonId) throw new Error(t.lessonRequired);
    if (!attendeeId) throw new Error(t.attendeeRequired);

    await prisma.$transaction(async (tx) => {
      await loadManagedLessonOrThrow({ tx, lessonId, locale, currentUser });

      const waitlistEntry = await tx.lessonWaitlistEntry.findUnique({
        where: {
          lessonId_traineeId: {
            lessonId,
            traineeId: attendeeId,
          },
        },
      });
      if (!waitlistEntry) throw new Error(t.queueMissing);

      await tx.lessonWaitlistEntry.delete({ where: { id: waitlistEntry.id } });
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
    return { ok: true, message: t.queueRemoved };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.queueRemoveFailed,
    };
  }
}
