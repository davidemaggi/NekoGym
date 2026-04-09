"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { requireAnyRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
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
    lessonUnavailable: isIt ? "Lezione non disponibile." : "Lesson is not available.",
    attendeeRequired: isIt ? "Utente non valido." : "Invalid user.",
    attendeeNotFound: isIt ? "Utente non trovato." : "User not found.",
    attendeeExists: isIt ? "Utente gia iscritto a questa lezione." : "User already booked for this lesson.",
    attendeeMissing: isIt ? "Utente non iscritto a questa lezione." : "User is not booked for this lesson.",
    lessonFull: isIt ? "Lezione piena." : "Lesson is full.",
    staffForbidden: isIt ? "Non puoi gestire questa lezione." : "You cannot manage this lesson.",
    sameCourseDay: isIt ? "Utente gia iscritto a questo corso nello stesso giorno." : "User already booked this course on the same day.",
    attendeeAdded: isIt ? "Iscritto aggiunto." : "Attendee added.",
    attendeeRemoved: isIt ? "Iscritto rimosso." : "Attendee removed.",
    trainerUpdated: isIt ? "Trainer aggiornato." : "Trainer updated.",
    standaloneCreated: isIt ? "Lezione creata." : "Lesson created.",
    standaloneUpdated: isIt ? "Lezione aggiornata." : "Lesson updated.",
    standaloneDeleted: isIt ? "Lezione eliminata." : "Lesson deleted.",
    standaloneCancelled: isIt ? "Lezione annullata perche aveva iscritti." : "Lesson cancelled because it had attendees.",
    standaloneOnly: isIt ? "Puoi modificare solo lezioni non collegate a un corso." : "Only standalone lessons can be changed.",
    startsAtRequired: isIt ? "Data/ora inizio obbligatoria." : "Start date/time is required.",
    numericInvalid: isIt ? "Campi numerici non validi." : "Numeric fields are invalid.",
    numericPositive: isIt ? "I campi numerici devono essere maggiori di zero." : "Numeric fields must be greater than zero.",
    trainerInvalid: isIt ? "Trainer non valido." : "Invalid trainer.",
    trainerForbidden: isIt ? "Come trainer puoi assegnare solo te stesso." : "As trainer you can only assign yourself.",
    lessonTypeInvalid: isIt ? "Tipo lezione non valido." : "Invalid lesson type.",
    failed: isIt ? "Impossibile aggiornare il trainer." : "Unable to update trainer.",
    pastLocked:
      isIt
        ? "Lezioni passate o in corso non modificabili (solo gestione partecipanti)."
        : "Past or ongoing lessons are read-only (attendees management only).",
  };
}

function isPastOrNow(startsAt: Date): boolean {
  return startsAt.getTime() <= Date.now();
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
      course: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!lesson) {
    throw new Error(t.lessonRequired);
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

function parsePositiveInt(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value <= 0) return null;
  return value;
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

async function validateTrainer(input: {
  tx: Prisma.TransactionClient;
  locale: string;
  trainerId: string | null;
  currentUser: { id: string; role: "ADMIN" | "TRAINER" | "TRAINEE" };
}) {
  const t = messages(input.locale);
  if (!input.trainerId) return null;

  if (input.currentUser.role === "TRAINER" && input.trainerId !== input.currentUser.id) {
    throw new Error(t.trainerForbidden);
  }

  const trainer = await input.tx.user.findUnique({
    where: { id: input.trainerId },
    select: { id: true, role: true, name: true },
  });

  if (!trainer || (trainer.role !== "TRAINER" && trainer.role !== "ADMIN")) {
    throw new Error(t.trainerInvalid);
  }

  return trainer;
}

async function validateLessonType(tx: Prisma.TransactionClient, lessonTypeId: string | null, locale: string) {
  const t = messages(locale);
  if (!lessonTypeId) return null;
  const lessonType = await tx.lessonType.findUnique({ where: { id: lessonTypeId }, select: { id: true } });
  if (!lessonType) {
    throw new Error(t.lessonTypeInvalid);
  }
  return lessonType;
}

async function enqueueStandaloneLessonNotification(
  tx: Prisma.TransactionClient,
  input: {
    locale: string;
    lessonId: string;
    startsAt: Date;
    courseName: string | null;
    trainerId: string | null;
    subject: string;
    body: string;
  }
) {
  const bookings = await tx.lessonBooking.findMany({
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
    const trainer = await tx.user.findUnique({
      where: { id: input.trainerId },
      select: { id: true, telegramChatId: true },
    });
    if (trainer) {
      targetMap.set(trainer.id, { id: trainer.id, telegramChatId: trainer.telegramChatId });
    }
  }

  const targets = Array.from(targetMap.values());
  if (targets.length === 0) return;

  await enqueueNotificationForUsers(tx, targets, {
    subject: input.subject,
    body: input.body,
  });
}

function parseStartsAt(raw: string, locale: string): Date {
  const t = messages(locale);
  if (!raw) throw new Error(t.startsAtRequired);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error(t.startsAtRequired);
  return date;
}

function redirectWithFlash(input: {
  locale: string;
  week: string;
  message: string;
  type: "success" | "error";
}) {
  const params = new URLSearchParams();
  if (input.week) params.set("week", input.week);
  params.set("flash", input.message);
  params.set("flashType", input.type);
  redirect(`/${input.locale}/lessons?${params.toString()}`);
}

export async function updateLessonTrainerAction(formData: FormData): Promise<void> {
  const locale = getField(formData, "locale") || "it";
  const week = getField(formData, "week");
  const lessonId = getField(formData, "lessonId");
  const trainerIdRaw = getField(formData, "trainerId");
  const trainerId = trainerIdRaw || null;
  const t = messages(locale);
  let flashType: "success" | "error" = "success";
  let flashMessage = t.trainerUpdated;

  try {
    const user = await requireAnyRole(["ADMIN"], locale);

    if (!lessonId) {
      throw new Error(t.lessonRequired);
    }

    await prisma.$transaction(async (tx) => {
      await validateTrainer({
        tx,
        locale,
        trainerId,
        currentUser: { id: user.id, role: user.role },
      });

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

      await enqueueStandaloneLessonNotification(tx, {
        locale,
        lessonId: lesson.id,
        startsAt: lesson.startsAt,
        courseName: lesson.course?.name ?? null,
        trainerId,
        subject: locale === "it" ? "Trainer lezione aggiornato" : "Lesson trainer updated",
        body:
          locale === "it"
            ? `Il trainer della lezione del ${formatDateForNotification(lesson.startsAt, locale)} e stato aggiornato.`
            : `Trainer for lesson on ${formatDateForNotification(lesson.startsAt, locale)} has been updated.`,
      });
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);

  } catch (error) {
    flashType = "error";
    flashMessage = error instanceof Error ? error.message : t.failed;
  }

  redirectWithFlash({ locale, week, message: flashMessage, type: flashType });
}

export async function createStandaloneLessonAction(formData: FormData): Promise<void> {
  const locale = getField(formData, "locale") || "it";
  const week = getField(formData, "week");
  const t = messages(locale);
  let flashType: "success" | "error" = "success";
  let flashMessage = t.standaloneCreated;

  try {
    await createStandaloneLesson(inputFromFormData(formData, locale));
  } catch (error) {
    flashType = "error";
    flashMessage = error instanceof Error ? error.message : t.failed;
  }

  redirectWithFlash({ locale, week, message: flashMessage, type: flashType });
}

function inputFromFormData(formData: FormData, locale: string) {
  return {
    locale,
    startsAtRaw: getField(formData, "startsAt"),
    durationMinutesRaw: getField(formData, "durationMinutes"),
    maxAttendeesRaw: getField(formData, "maxAttendees"),
    cancellationWindowHoursRaw: getField(formData, "cancellationWindowHours"),
    trainerIdRaw: getField(formData, "trainerId"),
    lessonTypeIdRaw: getField(formData, "lessonTypeId"),
  };
}

async function createStandaloneLesson(input: {
  locale: string;
  startsAtRaw: string;
  durationMinutesRaw: string;
  maxAttendeesRaw: string;
  cancellationWindowHoursRaw: string;
  trainerIdRaw: string;
  lessonTypeIdRaw: string;
}) {
  const { locale } = input;
  const t = messages(locale);
  const user = await requireAnyRole(["ADMIN", "TRAINER"], locale);

  const startsAt = parseStartsAt(input.startsAtRaw, locale);
  const durationMinutes = parsePositiveInt(input.durationMinutesRaw);
  const maxAttendees = parsePositiveInt(input.maxAttendeesRaw);
  const cancellationWindowHours = parsePositiveInt(input.cancellationWindowHoursRaw);
  const trainerId = input.trainerIdRaw || null;
  const lessonTypeId = input.lessonTypeIdRaw || null;

  if (!durationMinutes || !maxAttendees || !cancellationWindowHours) {
    throw new Error(t.numericInvalid);
  }

  await prisma.$transaction(async (tx) => {
    await validateTrainer({ tx, locale, trainerId, currentUser: user });
    await validateLessonType(tx, lessonTypeId, locale);

    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
    await tx.lesson.create({
      data: {
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
}

export async function createStandaloneLessonMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    await createStandaloneLesson(inputFromFormData(formData, locale));
    return { ok: true, message: t.standaloneCreated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.failed,
    };
  }
}

export async function updateStandaloneLessonAction(formData: FormData): Promise<void> {
  const locale = getField(formData, "locale") || "it";
  const week = getField(formData, "week");
  const t = messages(locale);
  let flashType: "success" | "error" = "success";
  let flashMessage = t.standaloneUpdated;

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
      if (lesson.courseId) throw new Error(t.standaloneOnly);
      if (isPastOrNow(lesson.startsAt)) throw new Error(t.pastLocked);

      await validateTrainer({ tx, locale, trainerId, currentUser: user });
      await validateLessonType(tx, lessonTypeId, locale);

      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
      const hasMeaningfulChange =
        lesson.startsAt.getTime() !== startsAt.getTime() ||
        lesson.endsAt.getTime() !== endsAt.getTime() ||
        lesson.trainerId !== trainerId;

      await tx.lesson.update({
        where: { id: lessonId },
        data: {
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
        await enqueueStandaloneLessonNotification(tx, {
          locale,
          lessonId,
          startsAt,
          courseName: null,
          trainerId,
          subject: locale === "it" ? "Lezione aggiornata" : "Lesson updated",
          body:
            locale === "it"
              ? `La lezione del ${formatDateForNotification(startsAt, locale)} e stata modificata.`
              : `Lesson on ${formatDateForNotification(startsAt, locale)} has been updated.`,
        });
      }
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
  } catch (error) {
    flashType = "error";
    flashMessage = error instanceof Error ? error.message : t.failed;
  }

  redirectWithFlash({ locale, week, message: flashMessage, type: flashType });
}

export async function deleteStandaloneLessonAction(formData: FormData): Promise<void> {
  const locale = getField(formData, "locale") || "it";
  const week = getField(formData, "week");
  const t = messages(locale);
  let flashType: "success" | "error" = "success";
  let flashMessage = t.standaloneDeleted;

  try {
    await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const lessonId = getField(formData, "lessonId");
    if (!lessonId) throw new Error(t.lessonRequired);

    await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        include: {
          bookings: { select: { id: true } },
        },
      });

      if (!lesson) throw new Error(t.lessonRequired);
      if (lesson.courseId) throw new Error(t.standaloneOnly);
      const shouldNotify = !isPastOrNow(lesson.startsAt);

      if (lesson.bookings.length > 0) {
        await tx.lesson.update({
          where: { id: lessonId },
          data: { status: "CANCELLED" },
        });

        if (shouldNotify) {
          await enqueueStandaloneLessonNotification(tx, {
            locale,
            lessonId,
            startsAt: lesson.startsAt,
            courseName: null,
            trainerId: lesson.trainerId,
            subject: locale === "it" ? "Lezione annullata" : "Lesson cancelled",
            body:
              locale === "it"
                ? `La lezione del ${formatDateForNotification(lesson.startsAt, locale)} e stata annullata.`
                : `Lesson on ${formatDateForNotification(lesson.startsAt, locale)} has been cancelled.`,
          });
        }

        flashMessage = t.standaloneCancelled;
      } else {
        await tx.lesson.delete({ where: { id: lessonId } });
      }
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);

  } catch (error) {
    flashType = "error";
    flashMessage = error instanceof Error ? error.message : t.failed;
  }

  redirectWithFlash({ locale, week, message: flashMessage, type: flashType });
}

export async function addLessonAttendeeAction(formData: FormData): Promise<void> {
  const locale = getField(formData, "locale") || "it";
  const week = getField(formData, "week");
  const lessonId = getField(formData, "lessonId");
  const attendeeId = getField(formData, "attendeeId");
  const t = messages(locale);
  let flashMessage = locale === "it" ? "Iscritto aggiunto." : "Attendee added.";
  let flashType: "success" | "error" = "success";

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
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
  } catch (error) {
    flashType = "error";
    flashMessage = error instanceof Error ? error.message : t.failed;
  }

  redirectWithFlash({ locale, week, message: flashMessage, type: flashType });
}

export async function removeLessonAttendeeAction(formData: FormData): Promise<void> {
  const locale = getField(formData, "locale") || "it";
  const week = getField(formData, "week");
  const lessonId = getField(formData, "lessonId");
  const attendeeId = getField(formData, "attendeeId");
  const t = messages(locale);
  let flashMessage = locale === "it" ? "Iscritto rimosso." : "Attendee removed.";
  let flashType: "success" | "error" = "success";

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
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
          await tx.lesson.update({ where: { id: lessonId }, data: { status: "CANCELLED" } });
        }
      }
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
  } catch (error) {
    flashType = "error";
    flashMessage = error instanceof Error ? error.message : t.failed;
  }

  redirectWithFlash({ locale, week, message: flashMessage, type: flashType });
}




