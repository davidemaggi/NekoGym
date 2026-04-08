"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

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
    traineeOnly: isIt ? "Solo i trainee possono prenotare." : "Only trainees can book lessons.",
    lessonUnavailable: isIt ? "Lezione non disponibile." : "Lesson is not available.",
    lessonStarted: isIt ? "La lezione e gia iniziata." : "Lesson has already started.",
    alreadyBooked: isIt ? "Sei gia iscritto a questa lezione." : "You are already booked for this lesson.",
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

    if (user.role !== "TRAINEE") {
      return { ok: false, message: messages.traineeOnly };
    }

    await prisma.$transaction(async (tx) => {
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

      const membershipAllowed = fullUser.membershipStatus === "ACTIVE" || isTrialActive(fullUser.trialEndsAt);
      if (!membershipAllowed) {
        throw new Error(messages.membershipDenied);
      }

      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        include: {
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

      if (lesson._count.bookings >= lesson.maxAttendees) {
        throw new Error(messages.noSeats);
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
            },
          },
        });

        if (sameCourseDayBooking) {
          throw new Error(messages.sameCourseDay);
        }
      }

      if (fullUser.membershipStatus === "ACTIVE" && fullUser.subscriptionType !== "NONE") {
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
              },
            },
          });

          if (bookingsInWindow >= fullUser.subscriptionLessons) {
            throw new Error(messages.planDenied);
          }
        }
      }

      await tx.lessonBooking.create({
        data: {
          lessonId,
          traineeId: user.id,
        },
      });

      if (fullUser.membershipStatus === "ACTIVE" && fullUser.subscriptionType === "FIXED") {
        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionRemaining:
              fullUser.subscriptionRemaining === null ? null : Math.max(0, fullUser.subscriptionRemaining - 1),
          },
        });
      }
    });

    revalidatePath(`/${locale}/bookings`);
    return { ok: true, message: messages.booked };
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

    if (user.role !== "TRAINEE") {
      return { ok: false, message: messages.traineeOnly };
    }

    await prisma.$transaction(async (tx) => {
      const fullUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!fullUser) {
        throw new Error(messages.authRequired);
      }

      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        include: {
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

      if (fullUser.membershipStatus === "ACTIVE" && fullUser.subscriptionType === "FIXED") {
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
    return { ok: true, message: messages.unbooked };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.unbookFailed,
    };
  }
}

