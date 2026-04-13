"use server";

import { revalidatePath } from "next/cache";
import type { LessonAttendanceStatus, Prisma } from "@prisma/client";

import { requireAnyRole } from "@/lib/authorization";
import { parseDateTimeLocalInputToUtc } from "@/lib/date-time";
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
    attendancePresentMarked: isIt ? "Presenza segnata." : "Attendance marked as present.",
    attendanceNoShowMarked: isIt ? "No-show segnato." : "Attendance marked as no-show.",
    failed: isIt ? "Impossibile creare la lezione." : "Unable to create lesson.",
    updateFailed: isIt ? "Impossibile aggiornare la lezione." : "Unable to update lesson.",
    mainUpdateFailed: isIt ? "Impossibile aggiornare i dettagli lezione." : "Unable to update lesson details.",
    trainerUpdateFailed: isIt ? "Impossibile aggiornare il trainer." : "Unable to update trainer.",
    attendeeAddFailed: isIt ? "Impossibile aggiungere iscritto." : "Unable to add attendee.",
    attendeeRemoveFailed: isIt ? "Impossibile rimuovere iscritto." : "Unable to remove attendee.",
    attendanceMarkFailed: isIt ? "Impossibile aggiornare presenza." : "Unable to update attendance.",
    attendanceOnlyAfterEnd:
      isIt
        ? "Puoi segnare presenza/no-show solo dopo la fine della lezione."
        : "You can mark attendance/no-show only after lesson end.",
    noShowSubject: isIt ? "Lezione persa (no-show)" : "Missed lesson (no-show)",
    noShowBody: (courseName: string | null, startsAt: Date) =>
      isIt
        ? `La tua presenza alla lezione ${courseName ?? "-"} del ${formatDateForNotification(startsAt, locale)} e stata segnata come no-show.`
        : `Your attendance for lesson ${courseName ?? "-"} on ${formatDateForNotification(startsAt, locale)} was marked as no-show.`,
    removedPastSubject: isIt ? "Prenotazione rimossa da lezione passata" : "Booking removed from past lesson",
    removedPastBody: (courseName: string | null, startsAt: Date) =>
      isIt
        ? `La tua prenotazione alla lezione ${courseName ?? "-"} del ${formatDateForNotification(startsAt, locale)} e stata rimossa. Puoi prenotare un'altra lezione.`
        : `Your booking for lesson ${courseName ?? "-"} on ${formatDateForNotification(startsAt, locale)} has been removed. You can book another lesson.`,
    pastLocked:
      isIt
        ? "Lezioni passate o in corso non modificabili (solo gestione partecipanti)."
        : "Past or ongoing lessons are read-only (attendees management only).",
    alreadyQueued: isIt ? "Utente gia in coda per questa lezione." : "User is already queued for this lesson.",
    queueMissing: isIt ? "Utente non presente in coda." : "User is not in waitlist.",
    queueConfirmed: isIt ? "Utente confermato dalla coda." : "User confirmed from waitlist.",
    queueRemoved: isIt ? "Utente rimosso dalla coda." : "User removed from waitlist.",
    waitlistPromotedSubject: isIt ? "Posto confermato dalla coda" : "Seat confirmed from waitlist",
    waitlistPromotedBody: (courseName: string | null, startsAt: Date) =>
      isIt
        ? `Si e liberato un posto: la tua iscrizione alla lezione ${courseName ?? "-"} del ${formatDateForNotification(startsAt, locale)} e ora confermata.`
        : `A seat is now available: your booking for lesson ${courseName ?? "-"} on ${formatDateForNotification(startsAt, locale)} is now confirmed.`,
    staffReplacementSubject: isIt ? "Sostituzione automatica in lezione" : "Automatic replacement in lesson",
    staffReplacementBody: (removedName: string, promotedName: string, courseName: string | null, startsAt: Date) =>
      isIt
        ? `${removedName} e stato rimosso dalla lezione ${courseName ?? "-"} del ${formatDateForNotification(startsAt, locale)}. ${promotedName} e stato confermato automaticamente dalla coda e ha preso il posto.`
        : `${removedName} was removed from lesson ${courseName ?? "-"} on ${formatDateForNotification(startsAt, locale)}. ${promotedName} was automatically confirmed from waitlist and took the seat.`,
    queueConfirmFailed: isIt ? "Impossibile confermare utente dalla coda." : "Unable to confirm user from waitlist.",
    queueRemoveFailed: isIt ? "Impossibile rimuovere utente dalla coda." : "Unable to remove user from waitlist.",
    broadcastMessageRequired: isIt ? "Messaggio notifica obbligatorio." : "Notification message is required.",
    broadcastNoRecipients: isIt ? "Nessun iscritto da notificare." : "No attendees to notify.",
    broadcastSent: isIt ? "Notifica inviata agli iscritti." : "Notification sent to attendees.",
    broadcastFailed: isIt ? "Impossibile inviare la notifica." : "Unable to send notification.",
  };
}

async function getLessonStaffTargets(input: {
  tx: Prisma.TransactionClient;
  lessonId: string;
}): Promise<Array<{ id: string; telegramChatId: string | null }>> {
  const lesson = await input.tx.lesson.findUnique({
    where: { id: input.lessonId },
    select: { trainerId: true },
  });
  const admins = await input.tx.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, telegramChatId: true },
  });

  const targets = new Map<string, { id: string; telegramChatId: string | null }>();
  for (const admin of admins) {
    targets.set(admin.id, admin);
  }

  if (lesson?.trainerId) {
    const trainer = await input.tx.user.findUnique({
      where: { id: lesson.trainerId },
      select: { id: true, telegramChatId: true },
    });
    if (trainer) {
      targets.set(trainer.id, trainer);
    }
  }

  return Array.from(targets.values());
}

async function promoteOldestWaitlistEntry(input: {
  tx: Prisma.TransactionClient;
  lessonId: string;
  confirmedById: string;
}): Promise<{ id: string; name: string; telegramChatId: string | null } | null> {
  while (true) {
    const firstQueued = await input.tx.lessonWaitlistEntry.findFirst({
      where: { lessonId: input.lessonId },
      orderBy: { createdAt: "asc" },
      include: {
        trainee: {
          select: {
            id: true,
            name: true,
            telegramChatId: true,
            role: true,
            membershipStatus: true,
            subscriptionType: true,
            subscriptionRemaining: true,
          },
        },
      },
    });

    if (!firstQueued) return null;

    const existingBooking = await input.tx.lessonBooking.findUnique({
      where: {
        lessonId_traineeId: {
          lessonId: input.lessonId,
          traineeId: firstQueued.traineeId,
        },
      },
      select: { id: true },
    });

    if (existingBooking) {
      await input.tx.lessonWaitlistEntry.delete({ where: { id: firstQueued.id } });
      continue;
    }

    await input.tx.lessonBooking.create({
      data: {
        lessonId: input.lessonId,
        traineeId: firstQueued.traineeId,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmedById: input.confirmedById,
      },
    });
    await input.tx.lessonWaitlistEntry.delete({ where: { id: firstQueued.id } });

    if (
      firstQueued.trainee.role === "TRAINEE" &&
      firstQueued.trainee.membershipStatus === "ACTIVE" &&
      firstQueued.trainee.subscriptionType === "FIXED"
    ) {
      await input.tx.user.update({
        where: { id: firstQueued.trainee.id },
        data: {
          subscriptionRemaining:
            firstQueued.trainee.subscriptionRemaining === null
              ? null
              : Math.max(0, firstQueued.trainee.subscriptionRemaining - 1),
        },
      });
    }

    return {
      id: firstQueued.trainee.id,
      name: firstQueued.trainee.name,
      telegramChatId: firstQueued.trainee.telegramChatId,
    };
  }
}

function isPastOrNow(startsAt: Date): boolean {
  return startsAt.getTime() <= Date.now();
}

function hasLessonEnded(endsAt: Date): boolean {
  return endsAt.getTime() <= Date.now();
}

function parsePositiveInt(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value <= 0) return null;
  return value;
}

function parseStartsAt(raw: string, locale: string): Date {
  const t = messages(locale);
  if (!raw) throw new Error(t.startsAtRequired);
  const date = parseDateTimeLocalInputToUtc(raw);
  if (!date) throw new Error(t.startsAtRequired);
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
      lessonType: { select: { name: true } },
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

async function refundFixedPlanOneUnitIfEligible(input: {
  tx: Prisma.TransactionClient;
  traineeId: string;
}) {
  const trainee = await input.tx.user.findUnique({
    where: { id: input.traineeId },
    select: {
      role: true,
      subscriptionType: true,
      subscriptionRemaining: true,
      subscriptionLessons: true,
    },
  });

  if (!trainee || trainee.role !== "TRAINEE" || trainee.subscriptionType !== "FIXED") return;

  const currentRemaining = trainee.subscriptionRemaining ?? 0;
  const maxLessons = trainee.subscriptionLessons ?? currentRemaining + 1;
  await input.tx.user.update({
    where: { id: input.traineeId },
    data: {
      subscriptionRemaining: Math.min(maxLessons, currentRemaining + 1),
    },
  });
}

async function consumeFixedPlanOneUnitIfEligible(input: {
  tx: Prisma.TransactionClient;
  traineeId: string;
}) {
  const trainee = await input.tx.user.findUnique({
    where: { id: input.traineeId },
    select: {
      role: true,
      membershipStatus: true,
      subscriptionType: true,
      subscriptionRemaining: true,
    },
  });

  if (
    !trainee ||
    trainee.role !== "TRAINEE" ||
    trainee.membershipStatus !== "ACTIVE" ||
    trainee.subscriptionType !== "FIXED"
  ) {
    return;
  }

  await input.tx.user.update({
    where: { id: input.traineeId },
    data: {
      subscriptionRemaining:
        trainee.subscriptionRemaining === null
          ? null
          : Math.max(0, trainee.subscriptionRemaining - 1),
    },
  });
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
          status: "CONFIRMED",
          confirmedAt: new Date(),
          confirmedById: currentUser.id,
        },
      });
      await consumeFixedPlanOneUnitIfEligible({
        tx,
        traineeId: attendeeId,
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
      await refundFixedPlanOneUnitIfEligible({
        tx,
        traineeId: booking.trainee.id,
      });

      const promotedFromQueue = await promoteOldestWaitlistEntry({
        tx,
        lessonId,
        confirmedById: currentUser.id,
      });

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

        if (promotedFromQueue) {
          await enqueueNotificationForUsers(
            tx,
            [{ id: promotedFromQueue.id, telegramChatId: promotedFromQueue.telegramChatId }],
            {
              subject: t.waitlistPromotedSubject,
              body: t.waitlistPromotedBody(lesson.course?.name ?? null, lesson.startsAt),
            }
          );

          const staffTargets = await getLessonStaffTargets({ tx, lessonId });
          if (staffTargets.length > 0) {
            await enqueueNotificationForUsers(tx, staffTargets, {
              subject: t.staffReplacementSubject,
              body: t.staffReplacementBody(booking.trainee.name, promotedFromQueue.name, lesson.course?.name ?? null, lesson.startsAt),
            });
          }
        } else if (remainingBookings < lesson.maxAttendees) {
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
      } else {
        await enqueueNotificationForUsers(
          tx,
          [{ id: booking.trainee.id, telegramChatId: booking.trainee.telegramChatId }],
          {
            subject: t.removedPastSubject,
            body: t.removedPastBody(lesson.course?.name ?? null, lesson.startsAt),
          }
        );
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

export async function setLessonAttendeeAttendanceMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const lessonId = getField(formData, "lessonId");
    const attendeeId = getField(formData, "attendeeId");
    const attendanceStatusRaw = getField(formData, "attendanceStatus");
    const attendanceStatus: LessonAttendanceStatus | null =
      attendanceStatusRaw === "PRESENT" || attendanceStatusRaw === "NO_SHOW"
        ? attendanceStatusRaw
        : null;

    if (!lessonId) throw new Error(t.lessonRequired);
    if (!attendeeId) throw new Error(t.attendeeRequired);
    if (!attendanceStatus) throw new Error(t.attendanceMarkFailed);

    await prisma.$transaction(async (tx) => {
      const lesson = await loadManagedLessonOrThrow({ tx, lessonId, locale, currentUser });
      if (!hasLessonEnded(lesson.endsAt)) {
        throw new Error(t.attendanceOnlyAfterEnd);
      }

      const booking = await tx.lessonBooking.findUnique({
        where: {
          lessonId_traineeId: {
            lessonId,
            traineeId: attendeeId,
          },
        },
        select: {
          id: true,
          attendanceStatus: true,
          trainee: {
            select: { id: true, telegramChatId: true },
          },
        },
      });
      if (!booking) throw new Error(t.attendeeMissing);

      await tx.lessonBooking.update({
        where: { id: booking.id },
        data: {
          attendanceStatus,
          attendanceMarkedAt: new Date(),
          attendanceMarkedById: currentUser.id,
        },
      });

      if (attendanceStatus === "NO_SHOW" && booking.attendanceStatus !== "NO_SHOW") {
        await enqueueNotificationForUsers(
          tx,
          [{ id: booking.trainee.id, telegramChatId: booking.trainee.telegramChatId }],
          {
            subject: t.noShowSubject,
            body: t.noShowBody(lesson.course?.name ?? null, lesson.startsAt),
          }
        );
      }
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
    return {
      ok: true,
      message: attendanceStatus === "NO_SHOW" ? t.attendanceNoShowMarked : t.attendancePresentMarked,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.attendanceMarkFailed,
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
          status: "CONFIRMED",
          confirmedAt: new Date(),
          confirmedById: currentUser.id,
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

export async function broadcastLessonNotificationMutationAction(formData: FormData): Promise<LessonMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const lessonId = getField(formData, "lessonId");
    const message = getField(formData, "message");
    if (!lessonId) throw new Error(t.lessonRequired);
    if (!message) throw new Error(t.broadcastMessageRequired);

    await prisma.$transaction(async (tx) => {
      const lesson = await loadManagedLessonOrThrow({
        tx,
        lessonId,
        locale,
        currentUser,
      });

      const bookings = await tx.lessonBooking.findMany({
        where: { lessonId },
        select: {
          trainee: {
            select: { id: true, telegramChatId: true },
          },
        },
      });

      if (bookings.length === 0) {
        throw new Error(t.broadcastNoRecipients);
      }

      const lessonName = (lesson.title?.trim() || lesson.course?.name || "-").trim();
      const lessonTypeName = lesson.lessonType?.name?.trim() || "-";
      const scheduleLabel = `${formatDateForNotification(lesson.startsAt, locale)} - ${new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(lesson.endsAt)}`;
      const detailsLabel = locale === "it" ? "Dettagli lezione" : "Lesson details";
      const subject = locale === "it" ? "Messaggio lezione" : "Lesson message";
      const body = `${message}\n\n${detailsLabel}:\n${locale === "it" ? "Nome" : "Name"}: ${lessonName}\n${locale === "it" ? "Tipo" : "Type"}: ${lessonTypeName}\n${locale === "it" ? "Quando" : "When"}: ${scheduleLabel}`;

      const targets = bookings.map((booking) => ({
        id: booking.trainee.id,
        telegramChatId: booking.trainee.telegramChatId,
      }));
      await enqueueNotificationForUsers(tx, targets, { subject, body });
    });

    return { ok: true, message: t.broadcastSent };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.broadcastFailed,
    };
  }
}
