"use server";

import { revalidatePath } from "next/cache";
import type { MembershipStatus, SubscriptionPlanType, UserRole } from "@prisma/client";

import { requireAnyRole } from "@/lib/authorization";
import { sendEmailVerification } from "@/lib/auth";
import {
  parseDateInputEndOfDayToUtc,
  parseDateInputToUtc,
  parseDateTimeLocalInputToUtc,
} from "@/lib/date-time";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { enqueueNotificationForUsers } from "@/server/outbox/queue";

type UserMutationResult = {
  ok: boolean;
  message: string;
};

const subscriptionTypes: SubscriptionPlanType[] = ["NONE", "WEEKLY", "MONTHLY", "FIXED"];
const membershipStatuses: MembershipStatus[] = ["ACTIVE", "INACTIVE"];
const roles: UserRole[] = ["ADMIN", "TRAINER", "TRAINEE"];
const lessonTypeAccessModes = ["DENIED", "REQUIRES_CONFIRMATION", "ALLOWED"] as const;
type LessonTypeAccessMode = (typeof lessonTypeAccessModes)[number];

function t(locale: string) {
  const isIt = locale === "it";
  return {
    idRequired: isIt ? "Utente non valido." : "Invalid user.",
    messageRequired: isIt ? "Messaggio obbligatorio." : "Message is required.",
    userNotFound: isIt ? "Utente non trovato." : "User not found.",
    directMessageSubject: isIt ? "Messaggio dall'amministrazione" : "Message from administration",
    required: isIt ? "Compila tutti i campi obbligatori." : "Fill all required fields.",
    emailUsed: isIt ? "Email gia in uso." : "Email already in use.",
    roleInvalid: isIt ? "Ruolo non valido." : "Invalid role.",
    membershipInvalid: isIt ? "Stato membership non valido." : "Invalid membership status.",
    subscriptionInvalid: isIt ? "Piano subscription non valido." : "Invalid subscription plan.",
    lessonsInvalid: isIt ? "Numero lezioni non valido." : "Invalid lessons amount.",
    lessonTypeAccessInvalid: isIt ? "Configurazione accessi tipo lezione non valida." : "Invalid lesson type access configuration.",
    created: isIt ? "Utente creato." : "User created.",
    updated: isIt ? "Utente aggiornato." : "User updated.",
    deleted: isIt ? "Utente eliminato." : "User deleted.",
    accountDisabled: isIt ? "Utente disattivato e sessioni terminate." : "User deactivated and sessions terminated.",
    accountEnabled: isIt ? "Utente riattivato." : "User re-activated.",
    sessionsTerminated: isIt ? "Sessioni utente terminate." : "User sessions terminated.",
    createFailed: isIt ? "Impossibile creare utente." : "Unable to create user.",
    updateFailed: isIt ? "Impossibile aggiornare utente." : "Unable to update user.",
    deleteFailed: isIt ? "Impossibile eliminare utente." : "Unable to delete user.",
    accountToggleFailed: isIt ? "Impossibile aggiornare lo stato utente." : "Unable to update user status.",
    terminateSessionsFailed: isIt ? "Impossibile terminare le sessioni utente." : "Unable to terminate user sessions.",
    cannotDeleteSelf: isIt ? "Non puoi eliminare il tuo utente." : "You cannot delete your own user.",
    cannotDisableSelf: isIt ? "Non puoi disattivare il tuo utente." : "You cannot deactivate your own user.",
    messageQueued: isIt ? "Notifica accodata." : "Notification queued.",
    futureBookingsRevoked:
      isIt
        ? "Alcune prenotazioni future sono state annullate per aggiornamento accessi ai tipi lezione."
        : "Some future bookings were cancelled due to lesson type access changes.",
    accessModeChangedSubject:
      isIt
        ? "Aggiornamento accessi tipi lezione"
        : "Lesson type access updated",
    accessModeChangedBody:
      isIt
        ? "Le tue impostazioni di accesso ai tipi lezione sono state aggiornate da un amministratore."
        : "Your lesson type access settings were updated by an admin.",
    messageFailed: isIt ? "Impossibile inviare il messaggio." : "Unable to send message.",
  };
}

function getField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBooleanField(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (typeof value !== "string") return false;
  return value === "true" || value === "on" || value === "1";
}

function parseNullableInt(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNullableDateInput(value: string): Date | null {
  if (!value) return null;
  const parsed = parseDateInputToUtc(value);
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function parseNullableDateTimeInput(value: string): Date | null {
  if (!value) return null;
  const parsed = parseDateTimeLocalInputToUtc(value);
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function parseEndOfDayDateInput(value: string): Date | null {
  if (!value) return null;
  const parsed = parseDateInputEndOfDayToUtc(value);
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function normalizeSubscription(input: {
  subscriptionType: SubscriptionPlanType;
  subscriptionLessons: number | null;
  subscriptionRemaining: number | null;
  subscriptionResetAt: Date | null;
  subscriptionEndsAt: Date | null;
}) {
  if (input.subscriptionType === "NONE") {
    return {
      subscriptionLessons: null,
      subscriptionRemaining: null,
      subscriptionResetAt: null,
      subscriptionEndsAt: null,
    };
  }

  return {
    subscriptionLessons: input.subscriptionLessons,
    subscriptionRemaining: input.subscriptionRemaining,
    subscriptionResetAt: input.subscriptionResetAt,
    subscriptionEndsAt: input.subscriptionEndsAt,
  };
}

function parseLessonTypeAccesses(formData: FormData): Array<{ lessonTypeId: string; mode: LessonTypeAccessMode }> {
  const entries: Array<{ lessonTypeId: string; mode: LessonTypeAccessMode }> = [];
  for (const [key, rawValue] of formData.entries()) {
    if (!key.startsWith("lessonTypeAccess:")) continue;
    const lessonTypeId = key.slice("lessonTypeAccess:".length).trim();
    if (!lessonTypeId || typeof rawValue !== "string") continue;
    if (!lessonTypeAccessModes.includes(rawValue as LessonTypeAccessMode)) continue;
    entries.push({ lessonTypeId, mode: rawValue as LessonTypeAccessMode });
  }
  return entries;
}

export async function createUserAction(formData: FormData): Promise<UserMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const msg = t(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);

    const name = getField(formData, "name");
    const email = getField(formData, "email").toLowerCase();
    const password = getField(formData, "password");
    const role = getField(formData, "role") as UserRole;
    const membershipStatus = getField(formData, "membershipStatus") as MembershipStatus;
    const trialEndsAt = parseNullableDateInput(getField(formData, "trialEndsAt"));
    const subscriptionType = getField(formData, "subscriptionType") as SubscriptionPlanType;
    const subscriptionLessons = parseNullableInt(getField(formData, "subscriptionLessons"));
    const subscriptionRemaining = parseNullableInt(getField(formData, "subscriptionRemaining"));
    const subscriptionResetAt = parseNullableDateTimeInput(getField(formData, "subscriptionResetAt"));
    const subscriptionEndsAt = parseEndOfDayDateInput(getField(formData, "subscriptionEndsAt"));
    const emailVerified = getBooleanField(formData, "emailVerified");
    const lessonTypeAccesses = parseLessonTypeAccesses(formData);

    if (!name || !email || !password) throw new Error(msg.required);
    if (!roles.includes(role)) throw new Error(msg.roleInvalid);
    if (!membershipStatuses.includes(membershipStatus)) throw new Error(msg.membershipInvalid);
    if (!subscriptionTypes.includes(subscriptionType)) throw new Error(msg.subscriptionInvalid);

    if (
      (subscriptionType !== "NONE" && (subscriptionLessons === null || subscriptionLessons <= 0)) ||
      (subscriptionRemaining !== null && subscriptionRemaining < 0)
    ) {
      throw new Error(msg.lessonsInvalid);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error(msg.emailUsed);

    const normalized = normalizeSubscription({
      subscriptionType,
      subscriptionLessons,
      subscriptionRemaining,
      subscriptionResetAt,
      subscriptionEndsAt,
    });

    const validLessonTypes = await prisma.lessonType.findMany({ select: { id: true } });
    const validLessonTypeIds = new Set(validLessonTypes.map((item) => item.id));
    const hasInvalidAccess = lessonTypeAccesses.some(
      (entry) => !validLessonTypeIds.has(entry.lessonTypeId) || !lessonTypeAccessModes.includes(entry.mode)
    );
    if (hasInvalidAccess) throw new Error(msg.lessonTypeAccessInvalid);

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          emailVerifiedAt: emailVerified ? new Date() : null,
          pendingEmail: null,
          passwordHash: hashPassword(password),
          role,
          membershipStatus,
          trialEndsAt,
          subscriptionType,
          subscriptionLessons: normalized.subscriptionLessons,
          subscriptionRemaining: normalized.subscriptionRemaining,
          subscriptionResetAt: normalized.subscriptionResetAt,
          subscriptionEndsAt: normalized.subscriptionEndsAt,
        },
      });

      const nonDefaultAccesses = lessonTypeAccesses.filter((entry) => entry.mode !== "REQUIRES_CONFIRMATION");
      if (nonDefaultAccesses.length > 0) {
        await tx.userLessonTypeAccess.createMany({
          data: nonDefaultAccesses.map((entry) => ({
            userId: user.id,
            lessonTypeId: entry.lessonTypeId,
            mode: entry.mode,
          })),
        });
      }

      return user;
    });

    await sendEmailVerification({ userId: createdUser.id, locale });

    revalidatePath(`/${locale}/users`);
    return { ok: true, message: msg.created };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : msg.createFailed,
    };
  }
}

export async function updateUserAction(formData: FormData): Promise<UserMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const msg = t(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);

    const id = getField(formData, "id");
    const name = getField(formData, "name");
    const email = getField(formData, "email").toLowerCase();
    const password = getField(formData, "password");
    const role = getField(formData, "role") as UserRole;
    const membershipStatus = getField(formData, "membershipStatus") as MembershipStatus;
    const trialEndsAt = parseNullableDateInput(getField(formData, "trialEndsAt"));
    const subscriptionType = getField(formData, "subscriptionType") as SubscriptionPlanType;
    const subscriptionLessons = parseNullableInt(getField(formData, "subscriptionLessons"));
    const subscriptionRemaining = parseNullableInt(getField(formData, "subscriptionRemaining"));
    const subscriptionResetAt = parseNullableDateTimeInput(getField(formData, "subscriptionResetAt"));
    const subscriptionEndsAt = parseEndOfDayDateInput(getField(formData, "subscriptionEndsAt"));
    const emailVerified = getBooleanField(formData, "emailVerified");
    const lessonTypeAccesses = parseLessonTypeAccesses(formData);

    if (!id) throw new Error(msg.idRequired);
    if (!name || !email) throw new Error(msg.required);
    if (!roles.includes(role)) throw new Error(msg.roleInvalid);
    if (!membershipStatuses.includes(membershipStatus)) throw new Error(msg.membershipInvalid);
    if (!subscriptionTypes.includes(subscriptionType)) throw new Error(msg.subscriptionInvalid);

    if (
      (subscriptionType !== "NONE" && (subscriptionLessons === null || subscriptionLessons <= 0)) ||
      (subscriptionRemaining !== null && subscriptionRemaining < 0)
    ) {
      throw new Error(msg.lessonsInvalid);
    }

    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== id) throw new Error(msg.emailUsed);

    const normalized = normalizeSubscription({
      subscriptionType,
      subscriptionLessons,
      subscriptionRemaining,
      subscriptionResetAt,
      subscriptionEndsAt,
    });

    const validLessonTypes = await prisma.lessonType.findMany({ select: { id: true } });
    const validLessonTypeIds = new Set(validLessonTypes.map((item) => item.id));
    const hasInvalidAccess = lessonTypeAccesses.some(
      (entry) => !validLessonTypeIds.has(entry.lessonTypeId) || !lessonTypeAccessModes.includes(entry.mode)
    );
    if (hasInvalidAccess) throw new Error(msg.lessonTypeAccessInvalid);

    const now = new Date();
    let revokedFutureBookingsCount = 0;
    let hasAccessChanges = false;
    const updatedUser = await prisma.$transaction(async (tx) => {
      const previousAccesses = await tx.userLessonTypeAccess.findMany({
        where: { userId: id },
        select: { lessonTypeId: true, mode: true },
      });
      const previousByLessonType = new Map(previousAccesses.map((entry) => [entry.lessonTypeId, entry.mode]));

      const user = await tx.user.update({
        where: { id },
        data: {
          name,
          email,
          emailVerifiedAt: emailVerified ? new Date() : null,
          pendingEmail: null,
          role,
          membershipStatus,
          trialEndsAt,
          subscriptionType,
          subscriptionLessons: normalized.subscriptionLessons,
          subscriptionRemaining: normalized.subscriptionRemaining,
          subscriptionResetAt: normalized.subscriptionResetAt,
          subscriptionEndsAt: normalized.subscriptionEndsAt,
          ...(password ? { passwordHash: hashPassword(password) } : {}),
        },
      });

      await tx.userLessonTypeAccess.deleteMany({ where: { userId: id } });
      const nonDefaultAccesses = lessonTypeAccesses.filter((entry) => entry.mode !== "REQUIRES_CONFIRMATION");
      if (nonDefaultAccesses.length > 0) {
        await tx.userLessonTypeAccess.createMany({
          data: nonDefaultAccesses.map((entry) => ({
            userId: id,
            lessonTypeId: entry.lessonTypeId,
            mode: entry.mode,
          })),
        });
      }

      const nextByLessonType = new Map(lessonTypeAccesses.map((entry) => [entry.lessonTypeId, entry.mode]));
      hasAccessChanges = validLessonTypes.some(
        (lessonType) =>
          (previousByLessonType.get(lessonType.id) ?? "REQUIRES_CONFIRMATION") !==
          (nextByLessonType.get(lessonType.id) ?? "REQUIRES_CONFIRMATION")
      );
      const newlyDenied = validLessonTypes
        .filter((lessonType) => (nextByLessonType.get(lessonType.id) ?? "REQUIRES_CONFIRMATION") === "DENIED")
        .map((lessonType) => lessonType.id)
        .filter((lessonTypeId) => (previousByLessonType.get(lessonTypeId) ?? "REQUIRES_CONFIRMATION") !== "DENIED");

      if (newlyDenied.length > 0) {
        const futureBookings = await tx.lessonBooking.findMany({
          where: {
            traineeId: id,
            lesson: {
              status: "SCHEDULED",
              deletedAt: null,
              startsAt: { gt: now },
              lessonTypeId: { in: newlyDenied },
            },
          },
          select: { id: true },
        });

        if (futureBookings.length > 0) {
          revokedFutureBookingsCount = futureBookings.length;
          await tx.lessonBooking.deleteMany({
            where: {
              id: { in: futureBookings.map((booking) => booking.id) },
            },
          });
        }

        await tx.lessonWaitlistEntry.deleteMany({
          where: {
            traineeId: id,
            lesson: {
              status: "SCHEDULED",
              deletedAt: null,
              startsAt: { gt: now },
              lessonTypeId: { in: newlyDenied },
            },
          },
        });
      }

      return user;
    });

    if (!emailVerified) {
      await sendEmailVerification({ userId: updatedUser.id, locale });
    }

    if (hasAccessChanges || revokedFutureBookingsCount > 0) {
      await prisma.$transaction(async (tx) => {
        await enqueueNotificationForUsers(
          tx,
          [{ id: updatedUser.id, telegramChatId: updatedUser.telegramChatId ?? null }],
          {
            subject: msg.accessModeChangedSubject,
            body:
              revokedFutureBookingsCount > 0
                ? `${msg.accessModeChangedBody} ${msg.futureBookingsRevoked}`
                : msg.accessModeChangedBody,
          }
        );
      });
    }

    revalidatePath(`/${locale}/users`);
    revalidatePath(`/${locale}/bookings`);
    revalidatePath(`/${locale}/lessons`);
    return { ok: true, message: msg.updated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : msg.updateFailed,
    };
  }
}

export async function deleteUserAction(formData: FormData): Promise<UserMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const msg = t(locale);

  try {
    const currentUser = await requireAnyRole(["ADMIN"], locale);
    const id = getField(formData, "id");

    if (!id) throw new Error(msg.idRequired);
    if (id === currentUser.id) throw new Error(msg.cannotDeleteSelf);

    await prisma.user.delete({ where: { id } });
    revalidatePath(`/${locale}/users`);

    return { ok: true, message: msg.deleted };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : msg.deleteFailed,
    };
  }
}

export async function toggleUserActivationAction(formData: FormData): Promise<UserMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const msg = t(locale);

  try {
    const currentUser = await requireAnyRole(["ADMIN"], locale);
    const id = getField(formData, "id");
    const disable = getBooleanField(formData, "disable");

    if (!id) throw new Error(msg.idRequired);
    if (id === currentUser.id && disable) throw new Error(msg.cannotDisableSelf);

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isDisabled: true },
    });
    if (!target) throw new Error(msg.userNotFound);

    await prisma.$transaction(async (tx) => {
      if (target.isDisabled !== disable) {
        await tx.user.update({
          where: { id },
          data: { isDisabled: disable },
        });
      }

      if (disable) {
        await tx.session.deleteMany({
          where: { userId: id },
        });
      }
    });

    revalidatePath(`/${locale}/users`);
    return { ok: true, message: disable ? msg.accountDisabled : msg.accountEnabled };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : msg.accountToggleFailed,
    };
  }
}

export async function terminateUserSessionsAction(formData: FormData): Promise<UserMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const msg = t(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);
    const id = getField(formData, "id");
    if (!id) throw new Error(msg.idRequired);

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!target) throw new Error(msg.userNotFound);

    await prisma.session.deleteMany({
      where: { userId: id },
    });

    revalidatePath(`/${locale}/users`);
    return { ok: true, message: msg.sessionsTerminated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : msg.terminateSessionsFailed,
    };
  }
}

export async function sendUserMessageAction(formData: FormData): Promise<UserMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const msg = t(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);
    const id = getField(formData, "id");
    const message = getField(formData, "message");

    if (!id) throw new Error(msg.idRequired);
    if (!message) throw new Error(msg.messageRequired);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        telegramChatId: true,
      },
    });

    if (!user) throw new Error(msg.userNotFound);

    await prisma.$transaction(async (tx) => {
      await enqueueNotificationForUsers(tx, [user], {
        subject: msg.directMessageSubject,
        body: message,
      });
    });

    revalidatePath(`/${locale}/users`);
    return { ok: true, message: msg.messageQueued };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : msg.messageFailed,
    };
  }
}
