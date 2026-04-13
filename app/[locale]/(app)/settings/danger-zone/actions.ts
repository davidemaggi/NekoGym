"use server";

import { revalidatePath } from "next/cache";

import { requireAnyRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  createBackup,
  deleteBackupFile,
  hardResetGymData,
  importUploadedBackup,
  restoreFromBackupFileName,
  verifyOtpOrThrow,
} from "@/lib/danger-zone";

type DangerZoneActionResult = {
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
    backupDone: isIt ? "Backup creato con successo." : "Backup created successfully.",
    backupFailed: isIt ? "Impossibile creare il backup." : "Unable to create backup.",
    backupDeleteDone: isIt ? "Backup eliminato con successo." : "Backup deleted successfully.",
    backupDeleteFailed: isIt ? "Impossibile eliminare il backup." : "Unable to delete backup.",
    uploadDone: isIt ? "Backup caricato con successo." : "Backup uploaded successfully.",
    uploadMissingFile: isIt ? "Seleziona un file backup da caricare." : "Select a backup file to upload.",
    uploadFailed: isIt ? "Impossibile caricare il backup." : "Unable to upload backup.",
    restoreDone: isIt ? "Restore completato con successo." : "Restore completed successfully.",
    restoreFailed: isIt ? "Restore fallito." : "Restore failed.",
    resetConfirmInvalid:
      isIt
        ? "Conferma reset non valida. Scrivi RESET nel campo conferma."
        : "Invalid reset confirmation. Type RESET in the confirmation field.",
    resetDone: isIt ? "Reset completato. Dati applicativi eliminati." : "Reset completed. App data has been removed.",
    resetFailed: isIt ? "Reset fallito." : "Reset failed.",
  };
}

export async function uploadBackupAction(formData: FormData): Promise<DangerZoneActionResult> {
  const locale = getField(formData, "locale") || "it";
  const messages = t(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);
    const file = formData.get("backupFile");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error(messages.uploadMissingFile);
    }

    const backup = await importUploadedBackup(file);
    revalidatePath(`/${locale}/settings/danger-zone`);
    return {
      ok: true,
      message: `${messages.uploadDone} (${backup.fileName})`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.uploadFailed,
    };
  }
}

export async function createBackupAction(formData: FormData): Promise<DangerZoneActionResult> {
  const locale = getField(formData, "locale") || "it";
  const messages = t(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);
    const backup = await createBackup();

    revalidatePath(`/${locale}/settings/danger-zone`);
    return {
      ok: true,
      message: `${messages.backupDone} (${backup.fileName})`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.backupFailed,
    };
  }
}

export async function deleteBackupAction(formData: FormData): Promise<DangerZoneActionResult> {
  const locale = getField(formData, "locale") || "it";
  const messages = t(locale);

  try {
    await requireAnyRole(["ADMIN"], locale);
    const backupFileName = getField(formData, "backupFileName");
    if (!backupFileName) {
      throw new Error(locale === "it" ? "Backup non valido." : "Invalid backup file.");
    }

    await deleteBackupFile(backupFileName);
    revalidatePath(`/${locale}/settings/danger-zone`);
    return {
      ok: true,
      message: `${messages.backupDeleteDone} (${backupFileName})`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.backupDeleteFailed,
    };
  }
}

export async function restoreBackupAction(formData: FormData): Promise<DangerZoneActionResult> {
  const locale = getField(formData, "locale") || "it";
  const messages = t(locale);

  try {
    const user = await requireAnyRole(["ADMIN"], locale);
    const backupFileName = getField(formData, "backupFileName");
    const otpCode = getField(formData, "otpCode");
    const createBackupFirst = getField(formData, "createBackupFirst") === "1";
    if (!backupFileName) {
      throw new Error(locale === "it" ? "Seleziona un backup." : "Select a backup file.");
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        totpEnabled: true,
        totpSecret: true,
      },
    });

    verifyOtpOrThrow({
      code: otpCode,
      totpEnabled: fullUser?.totpEnabled ?? false,
      totpSecret: fullUser?.totpSecret ?? null,
      locale,
    });

    if (createBackupFirst) {
      await createBackup();
    }

    await restoreFromBackupFileName(backupFileName);
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/settings/danger-zone`);

    return { ok: true, message: messages.restoreDone };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.restoreFailed,
    };
  }
}

export async function hardResetAction(formData: FormData): Promise<DangerZoneActionResult> {
  const locale = getField(formData, "locale") || "it";
  const messages = t(locale);

  try {
    const user = await requireAnyRole(["ADMIN"], locale);
    const otpCode = getField(formData, "otpCode");
    const confirmation = getField(formData, "confirmation");
    const createBackupFirst = getField(formData, "createBackupFirst") === "1";
    if (confirmation !== "RESET") {
      throw new Error(messages.resetConfirmInvalid);
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        totpEnabled: true,
        totpSecret: true,
      },
    });

    verifyOtpOrThrow({
      code: otpCode,
      totpEnabled: fullUser?.totpEnabled ?? false,
      totpSecret: fullUser?.totpSecret ?? null,
      locale,
    });

    if (createBackupFirst) {
      await createBackup();
    }
    await hardResetGymData({ keepAdminUserId: user.id });

    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/settings/danger-zone`);

    return { ok: true, message: messages.resetDone };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : messages.resetFailed,
    };
  }
}
