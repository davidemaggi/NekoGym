"use server";

import { revalidatePath } from "next/cache";
import type { MembershipStatus, SubscriptionPlanType, UserRole } from "@prisma/client";

import { requireAnyRole } from "@/lib/authorization";
import { sendEmailVerification } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

type UserMutationResult = {
  ok: boolean;
  message: string;
};

const subscriptionTypes: SubscriptionPlanType[] = ["NONE", "WEEKLY", "MONTHLY", "FIXED"];
const membershipStatuses: MembershipStatus[] = ["ACTIVE", "INACTIVE"];
const roles: UserRole[] = ["ADMIN", "TRAINER", "TRAINEE"];

function t(locale: string) {
  const isIt = locale === "it";
  return {
    idRequired: isIt ? "Utente non valido." : "Invalid user.",
    required: isIt ? "Compila tutti i campi obbligatori." : "Fill all required fields.",
    emailUsed: isIt ? "Email gia in uso." : "Email already in use.",
    roleInvalid: isIt ? "Ruolo non valido." : "Invalid role.",
    membershipInvalid: isIt ? "Stato membership non valido." : "Invalid membership status.",
    subscriptionInvalid: isIt ? "Piano subscription non valido." : "Invalid subscription plan.",
    lessonsInvalid: isIt ? "Numero lezioni non valido." : "Invalid lessons amount.",
    created: isIt ? "Utente creato." : "User created.",
    updated: isIt ? "Utente aggiornato." : "User updated.",
    deleted: isIt ? "Utente eliminato." : "User deleted.",
    createFailed: isIt ? "Impossibile creare utente." : "Unable to create user.",
    updateFailed: isIt ? "Impossibile aggiornare utente." : "Unable to update user.",
    deleteFailed: isIt ? "Impossibile eliminare utente." : "Unable to delete user.",
    cannotDeleteSelf: isIt ? "Non puoi eliminare il tuo utente." : "You cannot delete your own user.",
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

function parseNullableDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseEndOfDayDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(23, 59, 59, 999);
  return parsed;
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
    const trialEndsAt = parseNullableDate(getField(formData, "trialEndsAt"));
    const subscriptionType = getField(formData, "subscriptionType") as SubscriptionPlanType;
    const subscriptionLessons = parseNullableInt(getField(formData, "subscriptionLessons"));
    const subscriptionRemaining = parseNullableInt(getField(formData, "subscriptionRemaining"));
    const subscriptionResetAt = parseNullableDate(getField(formData, "subscriptionResetAt"));
    const subscriptionEndsAt = parseEndOfDayDate(getField(formData, "subscriptionEndsAt"));
    const emailVerified = getBooleanField(formData, "emailVerified");

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

    const createdUser = await prisma.user.create({
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
    const trialEndsAt = parseNullableDate(getField(formData, "trialEndsAt"));
    const subscriptionType = getField(formData, "subscriptionType") as SubscriptionPlanType;
    const subscriptionLessons = parseNullableInt(getField(formData, "subscriptionLessons"));
    const subscriptionRemaining = parseNullableInt(getField(formData, "subscriptionRemaining"));
    const subscriptionResetAt = parseNullableDate(getField(formData, "subscriptionResetAt"));
    const subscriptionEndsAt = parseEndOfDayDate(getField(formData, "subscriptionEndsAt"));
    const emailVerified = getBooleanField(formData, "emailVerified");

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

    const updatedUser = await prisma.user.update({
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

    if (!emailVerified) {
      await sendEmailVerification({ userId: updatedUser.id, locale });
    }

    revalidatePath(`/${locale}/users`);
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

