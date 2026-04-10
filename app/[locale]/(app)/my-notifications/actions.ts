"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

type NotificationMutationResult = {
  ok: boolean;
  message: string;
};

function getField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function t(locale: string) {
  const isIt = locale === "it";
  return {
    idRequired: isIt ? "Notifica non valida." : "Invalid notification.",
    deleted: isIt ? "Notifica eliminata." : "Notification deleted.",
    deletedAll: isIt ? "Tutte le notifiche eliminate." : "All notifications deleted.",
    deleteFailed: isIt ? "Impossibile eliminare notifica." : "Unable to delete notification.",
  };
}

export async function deleteLocalNotificationAction(formData: FormData): Promise<NotificationMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const id = getField(formData, "id");
  const msg = t(locale);

  try {
    const user = await requireAuth(locale);
    if (!id) throw new Error(msg.idRequired);

    await prisma.localNotification.deleteMany({
      where: { id, userId: user.id },
    });
    revalidatePath(`/${locale}/my-notifications`);
    return { ok: true, message: msg.deleted };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : msg.deleteFailed,
    };
  }
}

export async function deleteAllLocalNotificationsAction(formData: FormData): Promise<NotificationMutationResult> {
  const locale = getField(formData, "locale") || "it";
  const msg = t(locale);

  try {
    const user = await requireAuth(locale);
    await prisma.localNotification.deleteMany({
      where: { userId: user.id },
    });
    revalidatePath(`/${locale}/my-notifications`);
    return { ok: true, message: msg.deletedAll };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : msg.deleteFailed,
    };
  }
}
