"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { enqueueNotificationForUsers } from "@/server/outbox/queue";

type BookingActionResult = {
  ok: boolean;
  message: string;
};

function getField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bookingMessages(locale: string) {
  const isIt = locale === "it";
  return {
    lessonRequired: isIt ? "Lezione non valida." : "Invalid lesson.",
    authRequired: isIt ? "Devi essere autenticato." : "You must be authenticated.",
    lessonUnavailable: isIt ? "Lezione non disponibile." : "Lesson is not available.",
    lessonStarted: isIt ? "La lezione e gia iniziata." : "Lesson has already started.",
    alreadyBooked: isIt ? "Sei gia iscritto a questa lezione." : "You are already booked for this lesson.",
    alreadyQueued: isIt ? "Sei gia in coda per questa lezione." : "You are already queued for this lesson.",
    noSeats: isIt ? "Non ci sono posti disponibili." : "No seats available.",
    sameCourseDay:
      isIt
        ? "Hai gia una prenotazione per questo corso nello stesso giorno."
        : "You already booked this course on the same day.",
    planDenied:
      isIt
        ? "Il tuo piano non permette questa prenotazione."
        : "Your plan does not allow this booking.",
    membershipDenied:
      isIt
        ? "Membership non attiva e periodo di trial terminato."
        : "Membership inactive and trial period ended.",
    subscriptionExpired:
      isIt
        ? "La subscription e scaduta: membership impostata su inattiva."
        : "Subscription expired: membership set to inactive.",
    booked: isIt ? "Prenotazione completata." : "Booking completed.",
    queued: isIt ? "Lezione piena: sei stato messo in coda." : "Lesson full: you have been added to waitlist.",
    unbooked: isIt ? "Disiscrizione completata." : "Booking cancelled.",
    cannotUnbook: isIt ? "Tempo massimo per disiscriversi superato." : "Cancellation window has expired.",
    notBooked: isIt ? "Non risulti iscritto a questa lezione." : "You are not booked for this lesson.",
    failed: isIt ? "Impossibile prenotare la lezione." : "Unable to book lesson.",
    unbookFailed: isIt ? "Impossibile disiscriversi dalla lezione." : "Unable to cancel booking.",
  };
}

function isTrialActive(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return trialEndsAt >= new Date();
}

function lessonWindowForPlan(startsAt: Date, type: "WEEKLY" | "MONTHLY") {
  if (type === "WEEKLY") {
    const start = new Date(startsAt);
    const day = start.getDay();
    // JS: Sunday=0 ... Saturday=6. Business rule: week is Monday -> Sunday.
    const diffToMonday = (day + 6) % 7;
    start.setDate(start.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  const start = new Date(startsAt);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

function formatLessonDateTime(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

async function notifyTrainerBookingChanged(input: {
  tx: Prisma.TransactionClient;
  locale: string;
  actorName: string;
  action: "BOOKED" | "UNBOOKED";
  lesson: {
    startsAt: Date;
    trainerId: string | null;
    trainer: { id: string; telegramChatId: string | null } | null;
    course: { name: string } | null;
  };
}) {
  if (!input.lesson.trainerId || !input.lesson.trainer || input.lesson.trainer.id === "") return;

  if (input.lesson.trainer.id === "") return;

  const isIt = input.locale === "it";
  const actionText = input.action === "BOOKED"
    ? (isIt ? "si e iscritto" : "booked")
    : (isIt ? "si e disiscritto" : "cancelled booking");

  const subject = isIt ? "Aggiornamento prenotazione lezione" : "Lesson booking update";
  const body = isIt
    ? `${input.actorName} ${actionText} alla lezione ${input.lesson.course?.name ?? "-"} del ${formatLessonDateTime(input.lesson.startsAt, input.locale)}.`
    : `${input.actorName} ${actionText} for lesson ${input.lesson.course?.name ?? "-"} on ${formatLessonDateTime(input.lesson.startsAt, input.locale)}.`;

  await enqueueNotificationForUsers(
    input.tx,
    [{ id: input.lesson.trainer.id, telegramChatId: input.lesson.trainer.telegramChatId }],
    { subject, body }
  );
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

  const targets = queued.map((entry) => ({
    id: entry.trainee.id,
    telegramChatId: entry.trainee.telegramChatId,
  }));

  await enqueueNotificationForUsers(input.tx, targets, {
    subject: input.locale === "it" ? "Posto libero in lezione" : "Seat available in lesson",
    body:
      input.locale === "it"
        ? `Si e liberato un posto per la lezione ${input.courseName ?? "-"} del ${formatLessonDateTime(input.startsAt, input.locale)}.`
        : `A seat is now available for lesson ${input.courseName ?? "-"} on ${formatLessonDateTime(input.startsAt, input.locale)}.`,
  });
}

export async function bookLessonAction(formData: FormData): Promise<BookingActionResult> {
  const locale = getField(formData, "locale") || "it";
  const lessonId = getField(formData, "lessonId");
  const messages = bookingMessages(locale);

  if (!lessonId) {
    return { ok: false, message: messages.lessonRequired };
  }

  try {
    const user = await requireAuth(locale);
    if (!user) {
      return { ok: false, message: messages.authRequired };
    }

    const queued = await prisma.$transaction(async (tx) => {
      const fullUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!fullUser) {
        throw new Error(messages.authRequired);
      }
      const now = new Date();

      if (fullUser.subscriptionEndsAt && fullUser.subscriptionEndsAt < now) {
        await tx.user.update({
          where: { id: user.id },
          data: { membershipStatus: "INACTIVE" },
        });
        throw new Error(messages.subscriptionExpired);
      }

      if (fullUser.role === "TRAINEE") {
        const membershipAllowed = fullUser.membershipStatus === "ACTIVE" || isTrialActive(fullUser.trialEndsAt);
        if (!membershipAllowed) {
          throw new Error(messages.membershipDenied);
        }
      }

      const lesson = await tx.lesson.findFirst({
        where: { id: lessonId, deletedAt: null },
        include: {
          course: { select: { name: true } },
          trainer: { select: { id: true, telegramChatId: true } },
          _count: { select: { bookings: true } },
        },
      });

      if (!lesson || lesson.status !== "SCHEDULED") {
        throw new Error(messages.lessonUnavailable);
      }

      if (lesson.startsAt <= new Date()) {
        throw new Error(messages.lessonStarted);
      }

      const existing = await tx.lessonBooking.findUnique({
        where: {
          lessonId_traineeId: {
            lessonId,
            traineeId: user.id,
          },
        },
      });

      if (existing) {
        throw new Error(messages.alreadyBooked);
      }

      const existingQueue = await tx.lessonWaitlistEntry.findUnique({
        where: {
          lessonId_traineeId: {
            lessonId,
            traineeId: user.id,
          },
        },
      });
      if (existingQueue) {
        throw new Error(messages.alreadyQueued);
      }

      if (lesson.courseId) {
        const startOfDay = new Date(lesson.startsAt);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const sameCourseDayBooking = await tx.lessonBooking.findFirst({
          where: {
            traineeId: user.id,
            lesson: {
              courseId: lesson.courseId,
              startsAt: {
                gte: startOfDay,
                lt: endOfDay,
              },
              status: "SCHEDULED",
              deletedAt: null,
            },
          },
        });

        if (sameCourseDayBooking) {
          throw new Error(messages.sameCourseDay);
        }
      }

      if (fullUser.role === "TRAINEE" && fullUser.membershipStatus === "ACTIVE" && fullUser.subscriptionType !== "NONE") {
        if (fullUser.subscriptionType === "FIXED") {
          const remaining = fullUser.subscriptionRemaining;
          if (remaining !== null && remaining <= 0) {
            throw new Error(messages.planDenied);
          }
        }

        if (fullUser.subscriptionType === "WEEKLY" || fullUser.subscriptionType === "MONTHLY") {
          if (fullUser.subscriptionLessons === null || fullUser.subscriptionLessons <= 0) {
            throw new Error(messages.planDenied);
          }

          const window = lessonWindowForPlan(lesson.startsAt, fullUser.subscriptionType);
          const bookingsInWindow = await tx.lessonBooking.count({
            where: {
              traineeId: user.id,
              lesson: {
                status: "SCHEDULED",
                startsAt: {
                  gte: window.start,
                  lt: window.end,
                },
                deletedAt: null,
              },
            },
          });

          if (bookingsInWindow >= fullUser.subscriptionLessons) {
            throw new Error(messages.planDenied);
          }
        }
      }

      if (lesson._count.bookings >= lesson.maxAttendees) {
        await tx.lessonWaitlistEntry.create({
          data: {
            lessonId,
            traineeId: user.id,
          },
        });
        return true;
      }

      await tx.lessonBooking.create({
        data: {
          lessonId,
          traineeId: user.id,
        },
      });

      if (lesson.trainerId && lesson.trainer && lesson.trainer.id !== user.id) {
        await notifyTrainerBookingChanged({
          tx,
          locale,
          actorName: fullUser.name,
          action: "BOOKED",
          lesson,
        });
      }

      if (fullUser.role === "TRAINEE" && fullUser.membershipStatus === "ACTIVE" && fullUser.subscriptionType === "FIXED") {
        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionRemaining:
              fullUser.subscriptionRemaining === null ? null : Math.max(0, fullUser.subscriptionRemaining - 1),
          },
        });
      }

      return false;
    });

    revalidatePath(`/${locale}/bookings`);
    return { ok: true, message: queued ? messages.queued : messages.booked };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.failed,
    };
  }
}

export async function unbookLessonAction(formData: FormData): Promise<BookingActionResult> {
  const locale = getField(formData, "locale") || "it";
  const lessonId = getField(formData, "lessonId");
  const messages = bookingMessages(locale);

  if (!lessonId) {
    return { ok: false, message: messages.lessonRequired };
  }

  try {
    const user = await requireAuth(locale);
    if (!user) {
      return { ok: false, message: messages.authRequired };
    }

    await prisma.$transaction(async (tx) => {
      const fullUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!fullUser) {
        throw new Error(messages.authRequired);
      }

      const lesson = await tx.lesson.findFirst({
        where: { id: lessonId, deletedAt: null },
        include: {
          course: { select: { name: true } },
          trainer: { select: { id: true, telegramChatId: true } },
          bookings: {
            where: { traineeId: user.id },
            select: { id: true },
          },
        },
      });

      if (!lesson || lesson.status !== "SCHEDULED") {
        throw new Error(messages.lessonUnavailable);
      }

      const booking = lesson.bookings[0];
      if (!booking) {
        throw new Error(messages.notBooked);
      }

      const cutoff = new Date(lesson.startsAt.getTime() - lesson.cancellationWindowHours * 60 * 60 * 1000);
      if (new Date() > cutoff) {
        throw new Error(messages.cannotUnbook);
      }

      await tx.lessonBooking.delete({ where: { id: booking.id } });

      const remainingBookings = await tx.lessonBooking.count({ where: { lessonId } });

      if (lesson.trainerId && lesson.trainer && lesson.trainer.id !== user.id) {
        await notifyTrainerBookingChanged({
          tx,
          locale,
          actorName: fullUser.name,
          action: "UNBOOKED",
          lesson,
        });
      }

      const msUntilStart = lesson.startsAt.getTime() - Date.now();
      const noticeMs = lesson.cancellationWindowHours * 60 * 60 * 1000;
      const shouldCancelForNoticeWindow =
        remainingBookings === 0 && lesson.startsAt > new Date() && msUntilStart <= noticeMs;

      if (shouldCancelForNoticeWindow) {
        await tx.lesson.update({
          where: { id: lessonId },
          data: { status: "CANCELLED", deletedAt: new Date() },
        });
      } else if (remainingBookings < lesson.maxAttendees) {
        await notifyWaitlistSeatAvailable({
          tx,
          locale,
          lessonId,
          startsAt: lesson.startsAt,
          courseName: lesson.course?.name ?? null,
        });
      }

      if (fullUser.role === "TRAINEE" && fullUser.membershipStatus === "ACTIVE" && fullUser.subscriptionType === "FIXED") {
        const currentRemaining = fullUser.subscriptionRemaining ?? 0;
        const maxLessons = fullUser.subscriptionLessons ?? currentRemaining + 1;
        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionRemaining: Math.min(maxLessons, currentRemaining + 1),
          },
        });
      }
    });

    revalidatePath(`/${locale}/bookings`);
    revalidatePath(`/${locale}/lessons`);
    return { ok: true, message: messages.unbooked };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.unbookFailed,
    };
  }
}

