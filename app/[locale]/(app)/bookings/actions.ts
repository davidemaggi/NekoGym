"use server";

import { revalidatePath } from "next/cache";
import type { LessonTypeAccessMode, Prisma } from "@prisma/client";

import { requireAnyRole, requireAuth } from "@/lib/authorization";
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
    lessonTypeDenied:
      isIt
        ? "Non hai accesso a questo tipo di lezione."
        : "You do not have access to this lesson type.",
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
    pendingConfirmation:
      isIt
        ? "Richiesta inviata: in attesa di conferma trainer/admin."
        : "Request submitted: awaiting trainer/admin confirmation.",
    pendingRequestNotified:
      isIt
        ? "Richiesta inviata: trainer e admin sono stati notificati."
        : "Request submitted: trainer and admins have been notified.",
    unbooked: isIt ? "Disiscrizione completata." : "Booking cancelled.",
    waitlistPromotedSubject: isIt ? "Posto confermato dalla coda" : "Seat confirmed from waitlist",
    waitlistPromotedBody: (courseName: string, startsAt: Date) =>
      isIt
        ? `Si e liberato un posto: la tua iscrizione alla lezione ${courseName} del ${formatLessonDateTime(startsAt, locale)} e ora confermata.`
        : `A seat is now available: your booking for lesson ${courseName} on ${formatLessonDateTime(startsAt, locale)} is now confirmed.`,
    staffReplacementSubject: isIt ? "Sostituzione automatica in lezione" : "Automatic replacement in lesson",
    staffReplacementBody: (leavingName: string, promotedName: string, courseName: string, startsAt: Date) =>
      isIt
        ? `${leavingName} si e disiscritto dalla lezione ${courseName} del ${formatLessonDateTime(startsAt, locale)}. ${promotedName} e stato confermato automaticamente dalla coda e ha preso il posto.`
        : `${leavingName} cancelled booking for lesson ${courseName} on ${formatLessonDateTime(startsAt, locale)}. ${promotedName} was automatically confirmed from waitlist and took the seat.`,
    cannotUnbook: isIt ? "Tempo massimo per disiscriversi superato." : "Cancellation window has expired.",
    notBooked: isIt ? "Non risulti iscritto a questa lezione." : "You are not booked for this lesson.",
    failed: isIt ? "Impossibile prenotare la lezione." : "Unable to book lesson.",
    unbookFailed: isIt ? "Impossibile disiscriversi dalla lezione." : "Unable to cancel booking.",
    cannotConfirm: isIt ? "Non puoi confermare questa iscrizione." : "You cannot confirm this booking.",
    bookingMissing: isIt ? "Prenotazione non trovata." : "Booking not found.",
    alreadyConfirmed: isIt ? "Prenotazione gia confermata." : "Booking already confirmed.",
    confirmed: isIt ? "Prenotazione confermata." : "Booking confirmed.",
    confirmFailed: isIt ? "Impossibile confermare la prenotazione." : "Unable to confirm booking.",
    rejected: isIt ? "Prenotazione rifiutata." : "Booking rejected.",
    rejectFailed: isIt ? "Impossibile rifiutare la prenotazione." : "Unable to reject booking.",
    grantAccessAdminOnly:
      isIt
        ? "Solo un admin puo confermare con accesso libero."
        : "Only an admin can confirm with open access.",
  };
}

function isLessonFullError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("LESSON_FULL");
}

async function consumeFixedPlanUnitsIfEligible(input: {
  tx: Prisma.TransactionClient;
  traineeId: string;
  units: number;
}) {
  if (input.units <= 0) return;

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
          : Math.max(0, trainee.subscriptionRemaining - input.units),
    },
  });
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

async function getEffectiveLessonTypeAccessMode(input: {
  tx: Prisma.TransactionClient;
  userId: string;
  role: "ADMIN" | "TRAINER" | "TRAINEE";
  lessonTypeId: string | null;
}): Promise<LessonTypeAccessMode> {
  if (!input.lessonTypeId) return "ALLOWED";
  if (input.role !== "TRAINEE") return "ALLOWED";

  const row = await input.tx.userLessonTypeAccess.findUnique({
    where: {
      userId_lessonTypeId: {
        userId: input.userId,
        lessonTypeId: input.lessonTypeId,
      },
    },
    select: { mode: true },
  });

  return row?.mode ?? "REQUIRES_CONFIRMATION";
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
    if (trainer) targets.set(trainer.id, trainer);
  }
  return Array.from(targets.values());
}

async function getStaffTargetsForLessonIds(input: {
  tx: Prisma.TransactionClient;
  lessonIds: string[];
}): Promise<Array<{ id: string; telegramChatId: string | null }>> {
  if (input.lessonIds.length === 0) return [];
  const lessons = await input.tx.lesson.findMany({
    where: { id: { in: input.lessonIds } },
    select: { trainerId: true },
  });
  const admins = await input.tx.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, telegramChatId: true },
  });
  const trainerIds = Array.from(new Set(lessons.map((lesson) => lesson.trainerId).filter((id): id is string => Boolean(id))));
  const trainers = trainerIds.length > 0
    ? await input.tx.user.findMany({
        where: { id: { in: trainerIds } },
        select: { id: true, telegramChatId: true },
      })
    : [];

  const targets = new Map<string, { id: string; telegramChatId: string | null }>();
  for (const admin of admins) targets.set(admin.id, admin);
  for (const trainer of trainers) targets.set(trainer.id, trainer);
  return Array.from(targets.values());
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

    const outcome = await prisma.$transaction(async (tx) => {
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

      const accessMode = await getEffectiveLessonTypeAccessMode({
        tx,
        userId: user.id,
        role: fullUser.role,
        lessonTypeId: lesson.lessonTypeId ?? null,
      });
      if (accessMode === "DENIED") {
        throw new Error(messages.lessonTypeDenied);
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
        return "QUEUED" as const;
      }

      const requiresConfirmation = accessMode === "REQUIRES_CONFIRMATION";

      try {
        await tx.lessonBooking.create({
          data: {
            lessonId,
            traineeId: user.id,
            status: requiresConfirmation ? "PENDING" : "CONFIRMED",
            confirmedAt: requiresConfirmation ? null : new Date(),
            confirmedById: requiresConfirmation ? null : user.id,
          },
        });
      } catch (error) {
        if (!isLessonFullError(error)) {
          throw error;
        }

        await tx.lessonWaitlistEntry.upsert({
          where: {
            lessonId_traineeId: {
              lessonId,
              traineeId: user.id,
            },
          },
          create: {
            lessonId,
            traineeId: user.id,
          },
          update: {},
        });
        return "QUEUED" as const;
      }

      if (requiresConfirmation) {
        const staffTargets = await getLessonStaffTargets({ tx, lessonId });
        if (staffTargets.length > 0) {
          await enqueueNotificationForUsers(tx, staffTargets, {
            subject: locale === "it" ? "Nuova richiesta iscrizione da confermare" : "New booking request awaiting confirmation",
            body:
              locale === "it"
                ? `${fullUser.name} ha richiesto iscrizione alla lezione ${lesson.course?.name ?? "-"} del ${formatLessonDateTime(lesson.startsAt, locale)}.`
                : `${fullUser.name} requested booking for lesson ${lesson.course?.name ?? "-"} on ${formatLessonDateTime(lesson.startsAt, locale)}.`,
          });
        }
      }

      if (!requiresConfirmation && lesson.trainerId && lesson.trainer && lesson.trainer.id !== user.id) {
        await notifyTrainerBookingChanged({
          tx,
          locale,
          actorName: fullUser.name,
          action: "BOOKED",
          lesson,
        });
      }

      if (!requiresConfirmation) {
        await consumeFixedPlanUnitsIfEligible({
          tx,
          traineeId: user.id,
          units: 1,
        });
      }

      return requiresConfirmation ? ("PENDING" as const) : ("BOOKED" as const);
    });

    revalidatePath(`/${locale}/bookings`);
    revalidatePath(`/${locale}/lessons`);
    return {
      ok: true,
      message:
        outcome === "QUEUED"
          ? messages.queued
          : outcome === "PENDING"
            ? messages.pendingRequestNotified
            : messages.booked,
    };
  } catch (error) {
    return {
      ok: false,
      message: isLessonFullError(error)
        ? messages.noSeats
        : error instanceof Error
          ? error.message
          : messages.failed,
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

      const promotedFromQueue = await promoteOldestWaitlistEntry({
        tx,
        lessonId,
        confirmedById: user.id,
      });

      if (promotedFromQueue) {
        const courseName = lesson.course?.name ?? "-";
        await enqueueNotificationForUsers(
          tx,
          [{ id: promotedFromQueue.id, telegramChatId: promotedFromQueue.telegramChatId }],
          {
            subject: messages.waitlistPromotedSubject,
            body: messages.waitlistPromotedBody(courseName, lesson.startsAt),
          }
        );

        const staffTargets = await getLessonStaffTargets({ tx, lessonId });
        if (staffTargets.length > 0) {
          await enqueueNotificationForUsers(tx, staffTargets, {
            subject: messages.staffReplacementSubject,
            body: messages.staffReplacementBody(fullUser.name, promotedFromQueue.name, courseName, lesson.startsAt),
          });
        }
      } else if (lesson.trainerId && lesson.trainer && lesson.trainer.id !== user.id) {
        await notifyTrainerBookingChanged({
          tx,
          locale,
          actorName: fullUser.name,
          action: "UNBOOKED",
          lesson,
        });
      }

      const remainingBookings = await tx.lessonBooking.count({ where: { lessonId } });

      const msUntilStart = lesson.startsAt.getTime() - Date.now();
      const noticeMs = lesson.cancellationWindowHours * 60 * 60 * 1000;
      const shouldCancelForNoticeWindow =
        remainingBookings === 0 && lesson.startsAt > new Date() && msUntilStart <= noticeMs;

      if (shouldCancelForNoticeWindow) {
        await tx.lesson.update({
          where: { id: lessonId },
          data: { status: "CANCELLED", deletedAt: new Date() },
        });
      } else if (!promotedFromQueue && remainingBookings < lesson.maxAttendees) {
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

export async function confirmLessonBookingAction(formData: FormData): Promise<BookingActionResult> {
  const locale = getField(formData, "locale") || "it";
  const lessonId = getField(formData, "lessonId");
  const traineeId = getField(formData, "traineeId");
  const grantOpenAccess = getField(formData, "grantOpenAccess") === "1";
  const messages = bookingMessages(locale);

  if (!lessonId || !traineeId) {
    return { ok: false, message: messages.lessonRequired };
  }

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);
    if (grantOpenAccess && currentUser.role !== "ADMIN") {
      throw new Error(messages.grantAccessAdminOnly);
    }

    await prisma.$transaction(async (tx) => {
      const booking = await tx.lessonBooking.findUnique({
        where: {
          lessonId_traineeId: {
            lessonId,
            traineeId,
          },
        },
        include: {
          trainee: {
            select: { id: true, name: true, telegramChatId: true },
          },
          lesson: {
            select: {
              id: true,
              course: { select: { name: true } },
              trainerId: true,
              lessonTypeId: true,
              status: true,
              deletedAt: true,
              startsAt: true,
            },
          },
        },
      });

      if (!booking) throw new Error(messages.bookingMissing);
      const canManage = currentUser.role === "ADMIN" || booking.lesson.trainerId === currentUser.id;
      if (!canManage) throw new Error(messages.cannotConfirm);
      if (booking.lesson.status !== "SCHEDULED" || booking.lesson.deletedAt) throw new Error(messages.lessonUnavailable);
      if (booking.lesson.startsAt <= new Date()) throw new Error(messages.lessonStarted);
      if (booking.status === "CONFIRMED") throw new Error(messages.alreadyConfirmed);
      const now = new Date();
      let autoApprovedCount = 0;
      let affectedLessonIds = [booking.lesson.id];

      if (grantOpenAccess && booking.lesson.lessonTypeId) {
        await tx.userLessonTypeAccess.upsert({
          where: {
            userId_lessonTypeId: {
              userId: traineeId,
              lessonTypeId: booking.lesson.lessonTypeId,
            },
          },
          create: {
            userId: traineeId,
            lessonTypeId: booking.lesson.lessonTypeId,
            mode: "ALLOWED",
          },
          update: { mode: "ALLOWED" },
        });

        const pendingForType = await tx.lessonBooking.findMany({
          where: {
            traineeId,
            status: "PENDING",
            lesson: {
              lessonTypeId: booking.lesson.lessonTypeId,
              status: "SCHEDULED",
              deletedAt: null,
              startsAt: { gt: now },
              ...(currentUser.role === "TRAINER" ? { trainerId: currentUser.id } : {}),
            },
          },
          select: { id: true, lessonId: true },
        });
        if (pendingForType.length > 0) {
          const pendingIds = pendingForType.map((item) => item.id);
          affectedLessonIds = Array.from(new Set(pendingForType.map((item) => item.lessonId)));
          autoApprovedCount = pendingIds.length;
          await tx.lessonBooking.updateMany({
            where: { id: { in: pendingIds } },
            data: {
              status: "CONFIRMED",
              confirmedAt: now,
              confirmedById: currentUser.id,
            },
          });
        }
      } else {
        await tx.lessonBooking.update({
          where: { id: booking.id },
          data: {
            status: "CONFIRMED",
            confirmedAt: now,
            confirmedById: currentUser.id,
          },
        });
        autoApprovedCount = 1;
      }

      await consumeFixedPlanUnitsIfEligible({
        tx,
        traineeId: booking.trainee.id,
        units: autoApprovedCount,
      });

      const staffTargets = await getStaffTargetsForLessonIds({ tx, lessonIds: affectedLessonIds });
      if (staffTargets.length > 0) {
        await enqueueNotificationForUsers(tx, staffTargets, {
          subject: locale === "it" ? "Iscrizione lezione confermata" : "Lesson booking confirmed",
          body:
            locale === "it"
              ? `${booking.trainee.name} e stato confermato per ${autoApprovedCount} richiesta/e (tipo ${booking.lesson.course?.name ?? "-"}) con prima lezione il ${formatLessonDateTime(booking.lesson.startsAt, locale)}.`
              : `${booking.trainee.name} has been confirmed for ${autoApprovedCount} request(s) (type ${booking.lesson.course?.name ?? "-"}) with first lesson on ${formatLessonDateTime(booking.lesson.startsAt, locale)}.`,
        });
      }

      await enqueueNotificationForUsers(
        tx,
        [{ id: booking.trainee.id, telegramChatId: booking.trainee.telegramChatId }],
        {
          subject: locale === "it" ? "Iscrizione confermata" : "Booking confirmed",
          body:
            locale === "it"
              ? `La tua iscrizione e stata confermata. Richieste approvate: ${autoApprovedCount}. Prima lezione: ${booking.lesson.course?.name ?? "-"} del ${formatLessonDateTime(booking.lesson.startsAt, locale)}.`
              : `Your booking has been confirmed. Approved requests: ${autoApprovedCount}. First lesson: ${booking.lesson.course?.name ?? "-"} on ${formatLessonDateTime(booking.lesson.startsAt, locale)}.`,
        }
      );
    });

    revalidatePath(`/${locale}/bookings`);
    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/users`);
    return { ok: true, message: messages.confirmed };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.confirmFailed,
    };
  }
}

export async function rejectLessonBookingAction(formData: FormData): Promise<BookingActionResult> {
  const locale = getField(formData, "locale") || "it";
  const lessonId = getField(formData, "lessonId");
  const traineeId = getField(formData, "traineeId");
  const messages = bookingMessages(locale);

  if (!lessonId || !traineeId) {
    return { ok: false, message: messages.lessonRequired };
  }

  try {
    const currentUser = await requireAnyRole(["ADMIN", "TRAINER"], locale);

    await prisma.$transaction(async (tx) => {
      const booking = await tx.lessonBooking.findUnique({
        where: {
          lessonId_traineeId: {
            lessonId,
            traineeId,
          },
        },
        include: {
          trainee: {
            select: { id: true, name: true, telegramChatId: true },
          },
          lesson: {
            select: {
              id: true,
              course: { select: { name: true } },
              trainerId: true,
              status: true,
              deletedAt: true,
              startsAt: true,
            },
          },
        },
      });

      if (!booking) throw new Error(messages.bookingMissing);
      const canManage = currentUser.role === "ADMIN" || booking.lesson.trainerId === currentUser.id;
      if (!canManage) throw new Error(messages.cannotConfirm);
      if (booking.lesson.status !== "SCHEDULED" || booking.lesson.deletedAt) throw new Error(messages.lessonUnavailable);
      if (booking.lesson.startsAt <= new Date()) throw new Error(messages.lessonStarted);
      if (booking.status !== "PENDING") throw new Error(messages.alreadyConfirmed);

      await tx.lessonBooking.delete({ where: { id: booking.id } });

      const staffTargets = await getLessonStaffTargets({ tx, lessonId });
      if (staffTargets.length > 0) {
        await enqueueNotificationForUsers(tx, staffTargets, {
          subject: locale === "it" ? "Iscrizione lezione rifiutata" : "Lesson booking rejected",
          body:
            locale === "it"
              ? `${booking.trainee.name} non e stato confermato per la lezione ${booking.lesson.course?.name ?? "-"} del ${formatLessonDateTime(booking.lesson.startsAt, locale)}.`
              : `${booking.trainee.name} was not confirmed for lesson ${booking.lesson.course?.name ?? "-"} on ${formatLessonDateTime(booking.lesson.startsAt, locale)}.`,
        });
      }

      await enqueueNotificationForUsers(
        tx,
        [{ id: booking.trainee.id, telegramChatId: booking.trainee.telegramChatId }],
        {
          subject: locale === "it" ? "Iscrizione non confermata" : "Booking not confirmed",
          body:
            locale === "it"
              ? `La tua iscrizione alla lezione ${booking.lesson.course?.name ?? "-"} del ${formatLessonDateTime(booking.lesson.startsAt, locale)} non e stata confermata.`
              : `Your booking for lesson ${booking.lesson.course?.name ?? "-"} on ${formatLessonDateTime(booking.lesson.startsAt, locale)} was not confirmed.`,
        }
      );
    });

    revalidatePath(`/${locale}/bookings`);
    revalidatePath(`/${locale}/lessons`);
    revalidatePath(`/${locale}`);
    return { ok: true, message: messages.rejected };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.rejectFailed,
    };
  }
}
