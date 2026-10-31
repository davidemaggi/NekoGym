"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { requireAnyRole } from "@/lib/authorization";
import {
  formatLessonDateTime,
  reconsumeFixedPlanUnitsForRestoredLesson,
  refundFixedPlanUnitsForCancelledLesson,
} from "@/lib/booking-rules";
import { prisma } from "@/lib/prisma";
import { enqueueNotificationForUsers } from "@/server/outbox/queue";

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
    lessonRestored: isIt ? "Lezione ripristinata." : "Lesson restored.",
    lessonRestoreFailed: isIt ? "Impossibile ripristinare la lezione." : "Unable to restore lesson.",
    restoreBlockedByCourse:
      isIt
        ? "Impossibile ripristinare: il corso collegato e cancellato."
        : "Cannot restore: linked course is deleted.",
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

function formatDateForNotification(date: Date, locale: string): string {
  return formatLessonDateTime(date, locale);
}

function redirectWithFlash(input: {
  locale: string;
  month?: string;
  week?: string;
  showDeleted?: string;
  showPast?: string;
  message: string;
  type: "success" | "error";
}) {
  const params = new URLSearchParams();
  if (input.month) {
    params.set("month", input.month);
  } else if (input.week) {
    // Backward compatibility with old weekly pagination URLs.
    params.set("week", input.week);
  }
  if (input.showDeleted === "1") params.set("showDeleted", "1");
  if (input.showPast === "1") params.set("showPast", "1");
  params.set("flash", input.message);
  params.set("flashType", input.type);
  redirect(`/${input.locale}/lessons?${params.toString()}`);
}

function readNavigationCursor(formData: FormData): { month: string; week: string } {
  return {
    month: getField(formData, "month"),
    week: getField(formData, "week"),
  };
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

export async function deleteStandaloneLessonAction(formData: FormData): Promise<void> {
  const locale = getField(formData, "locale") || "it";
  const { month, week } = readNavigationCursor(formData);
  const showDeleted = getField(formData, "showDeleted");
  const showPast = getField(formData, "showPast");
  const t = messages(locale);
  let flashType: "success" | "error" = "success";
  let flashMessage = t.standaloneDeleted;

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    const lessonId = getField(formData, "lessonId");
    if (!lessonId) throw new Error(t.lessonRequired);

    await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        include: {
          bookings: { select: { id: true } },
          course: { select: { name: true } },
        },
      });

      if (!lesson) throw new Error(t.lessonRequired);
      if (lesson.deletedAt) return;
      if (currentUser.role === "TRAINER" && lesson.trainerId !== currentUser.id) {
        throw new Error(t.staffForbidden);
      }

      const shouldNotify = !isPastOrNow(lesson.startsAt);

      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          status: "CANCELLED",
          deletedAt: new Date(),
        },
      });

      if (lesson.bookings.length > 0) {
        if (shouldNotify) {
          // Future lesson cancelled by staff: attendees get their FIXED-plan lesson back.
          await refundFixedPlanUnitsForCancelledLesson(tx, lessonId);
          await enqueueStandaloneLessonNotification(tx, {
            locale,
            lessonId,
            startsAt: lesson.startsAt,
            courseName: lesson.course?.name ?? null,
            trainerId: lesson.trainerId,
            subject: locale === "it" ? "Lezione annullata" : "Lesson cancelled",
            body:
              locale === "it"
                ? `La lezione del ${formatDateForNotification(lesson.startsAt, locale)} e stata annullata.`
                : `Lesson on ${formatDateForNotification(lesson.startsAt, locale)} has been cancelled.`,
          });
        }

        flashMessage = t.standaloneCancelled;
      }
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);

  } catch (error) {
    unstable_rethrow(error);
    flashType = "error";
    flashMessage = error instanceof Error ? error.message : t.failed;
  }

  redirectWithFlash({ locale, month, week, showDeleted, showPast, message: flashMessage, type: flashType });
}

export async function restoreLessonAction(formData: FormData): Promise<void> {
  const locale = getField(formData, "locale") || "it";
  const { month, week } = readNavigationCursor(formData);
  const showDeleted = getField(formData, "showDeleted");
  const showPast = getField(formData, "showPast");
  const lessonId = getField(formData, "lessonId");
  const t = messages(locale);
  let flashType: "success" | "error" = "success";
  let flashMessage = t.lessonRestored;

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    if (!lessonId) throw new Error(t.lessonRequired);

    await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        include: {
          course: { select: { deletedAt: true } },
        },
      });

      if (!lesson) throw new Error(t.lessonRequired);
      if (currentUser.role === "TRAINER" && lesson.trainerId !== currentUser.id) {
        throw new Error(t.staffForbidden);
      }

      if (!lesson.deletedAt) {
        return;
      }

      if (lesson.course?.deletedAt) {
        throw new Error(t.restoreBlockedByCourse);
      }

      const restoringFuture = lesson.startsAt > new Date();
      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          deletedAt: null,
          status: restoringFuture ? "SCHEDULED" : lesson.status,
        },
      });
      // Mirrors the refund given when the future lesson was cancelled.
      if (restoringFuture) {
        await reconsumeFixedPlanUnitsForRestoredLesson(tx, lessonId);
      }
    });

    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}/bookings`);
  } catch (error) {
    unstable_rethrow(error);
    flashType = "error";
    flashMessage = error instanceof Error ? error.message : t.lessonRestoreFailed;
  }

  redirectWithFlash({ locale, month, week, showDeleted, showPast, message: flashMessage, type: flashType });
}

