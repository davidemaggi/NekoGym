"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { enqueueNotificationForUsers } from "@/server/outbox/queue";

type SendManualNotificationResult = {
  ok: boolean;
  message: string;
};

type RetryOutboxResult = {
  ok: boolean;
  message: string;
};

type Audience = "ALL" | "TRAINERS" | "TRAINEES";

function getField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function messages(locale: string) {
  const isIt = locale === "it";
  return {
    subjectRequired: isIt ? "Oggetto obbligatorio." : "Subject is required.",
    bodyRequired: isIt ? "Messaggio obbligatorio." : "Message is required.",
    audienceInvalid: isIt ? "Destinatari non validi." : "Invalid audience.",
    noUsers: isIt ? "Nessun utente trovato per i destinatari selezionati." : "No users found for selected audience.",
    queued: isIt ? "Notifica accodata con successo." : "Notification queued successfully.",
    retryDone: isIt ? "Retry accodato." : "Retry queued.",
    retryBulkDone: isIt ? "Retry multiplo accodato." : "Bulk retry queued.",
    retryNone: isIt ? "Nessun elemento selezionato." : "No item selected.",
    retryFailed: isIt ? "Impossibile aggiornare il retry." : "Unable to retry item.",
    failed: isIt ? "Impossibile accodare la notifica." : "Unable to queue notification.",
  };
}

function parseAudience(value: string): Audience | null {
  if (value === "ALL" || value === "TRAINERS" || value === "TRAINEES") return value;
  return null;
}

export async function sendManualNotificationAction(formData: FormData): Promise<SendManualNotificationResult> {
  const locale = getField(formData, "locale") || "it";
  const t = messages(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);

    const subject = getField(formData, "subject");
    const body = getField(formData, "body");
    const audience = parseAudience(getField(formData, "audience"));

    if (!subject) {
      throw new Error(t.subjectRequired);
    }

    if (!body) {
      throw new Error(t.bodyRequired);
    }

    if (!audience) {
      throw new Error(t.audienceInvalid);
    }

    const where =
      audience === "ALL"
        ? {}
        : audience === "TRAINERS"
          ? { role: "TRAINER" as const }
          : { role: "TRAINEE" as const };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        telegramChatId: true,
      },
    });

    if (users.length === 0) {
      throw new Error(t.noUsers);
    }

    await prisma.$transaction(async (tx) => {
      await enqueueNotificationForUsers(tx, users, { subject, body });
    });

    revalidatePath(`/${locale}/settings/notifications`);
    return { ok: true, message: t.queued };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.failed,
    };
  }
}

export async function retryOutboxItemAction(formData: FormData): Promise<RetryOutboxResult> {
  const locale = getField(formData, "locale") || "it";
  const id = getField(formData, "id");
  const t = messages(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);
    if (!id) {
      throw new Error(t.retryNone);
    }

    await prisma.notificationOutbox.updateMany({
      where: { id, status: "FAILED" },
      data: {
        status: "PENDING",
        availableAt: new Date(),
        lastError: null,
      },
    });

    revalidatePath(`/${locale}/settings/notifications`);
    return { ok: true, message: t.retryDone };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.retryFailed,
    };
  }
}

export async function retryOutboxItemsBulkAction(formData: FormData): Promise<RetryOutboxResult> {
  const locale = getField(formData, "locale") || "it";
  const ids = formData
    .getAll("ids")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const t = messages(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);
    if (ids.length === 0) {
      throw new Error(t.retryNone);
    }

    await prisma.notificationOutbox.updateMany({
      where: { id: { in: ids }, status: "FAILED" },
      data: {
        status: "PENDING",
        availableAt: new Date(),
        lastError: null,
      },
    });

    revalidatePath(`/${locale}/settings/notifications`);
    return { ok: true, message: t.retryBulkDone };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.retryFailed,
    };
  }
}

