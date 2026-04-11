import "server-only";

import { copyFile, mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

import { prisma } from "@/lib/prisma";
import { BACKUPS_DIR, SQLITE_DB_PATH } from "@/lib/storage-paths";
import { verifyTotpCode } from "@/lib/totp";

const BACKUP_DIR = BACKUPS_DIR;
const BACKUP_PREFIX = "nekogym-backup-";
const BACKUP_SUFFIX = ".sqlite";
const IMPORTED_BACKUP_PREFIX = "nekogym-imported-";
const ALLOWED_IMPORT_EXTENSIONS = new Set([".sqlite", ".db", ".sqlite3"]);
const MAX_IMPORT_SIZE_BYTES = 1024 * 1024 * 512; // 512 MB

export type DbBackupFile = {
  fileName: string;
  fullPath: string;
  createdAt: Date;
  sizeBytes: number;
};

function assertFileNameSafe(fileName: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    throw new Error("Invalid backup file name.");
  }
}

export function resolveSqliteDbPath() {
  return SQLITE_DB_PATH;
}

function formatBackupTimestamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export async function ensureBackupDir() {
  await mkdir(BACKUP_DIR, { recursive: true });
  return BACKUP_DIR;
}

export async function listBackups(): Promise<DbBackupFile[]> {
  await ensureBackupDir();
  const entries = await readdir(BACKUP_DIR, { withFileTypes: true });

  const backups = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const fullPath = join(BACKUP_DIR, entry.name);
        const info = await stat(fullPath);
        return {
          fileName: entry.name,
          fullPath,
          createdAt: info.mtime,
          sizeBytes: info.size,
        } satisfies DbBackupFile;
      })
  );

  return backups
    .filter(
      (item) =>
        (item.fileName.startsWith(BACKUP_PREFIX) || item.fileName.startsWith(IMPORTED_BACKUP_PREFIX)) &&
        extname(item.fileName) === BACKUP_SUFFIX
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createBackup() {
  await ensureBackupDir();
  const dbPath = resolveSqliteDbPath();
  const fileName = `${BACKUP_PREFIX}${formatBackupTimestamp(new Date())}${BACKUP_SUFFIX}`;
  const targetPath = join(BACKUP_DIR, fileName);
  await copyFile(dbPath, targetPath);
  return { fileName, fullPath: targetPath };
}

function sanitizeImportedBaseName(fileName: string) {
  const baseName = basename(fileName, extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return baseName || "external-backup";
}

export async function importUploadedBackup(file: File) {
  await ensureBackupDir();

  if (!file.name) {
    throw new Error("Missing uploaded file name.");
  }
  if (file.size <= 0) {
    throw new Error("Uploaded backup is empty.");
  }
  if (file.size > MAX_IMPORT_SIZE_BYTES) {
    throw new Error("Uploaded backup is too large.");
  }

  const extension = extname(file.name).toLowerCase();
  if (!ALLOWED_IMPORT_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported backup file extension.");
  }

  const safeBase = sanitizeImportedBaseName(file.name);
  const fileName = `${IMPORTED_BACKUP_PREFIX}${safeBase}-${formatBackupTimestamp(new Date())}${BACKUP_SUFFIX}`;
  const targetPath = join(BACKUP_DIR, fileName);

  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(targetPath, bytes);

  return { fileName, fullPath: targetPath };
}

export async function restoreFromBackupFileName(fileName: string) {
  assertFileNameSafe(fileName);

  await ensureBackupDir();
  const sourcePath = join(BACKUP_DIR, basename(fileName));
  const sourceInfo = await stat(sourcePath);
  if (!sourceInfo.isFile()) {
    throw new Error("Backup file not found.");
  }

  const dbPath = resolveSqliteDbPath();
  const rollbackBackup = `${BACKUP_PREFIX}auto-before-restore-${formatBackupTimestamp(new Date())}${BACKUP_SUFFIX}`;
  const rollbackPath = join(BACKUP_DIR, rollbackBackup);
  await copyFile(dbPath, rollbackPath);

  await prisma.$disconnect();
  await copyFile(sourcePath, dbPath);

  return { rollbackBackup };
}

export async function deleteBackupFile(fileName: string) {
  assertFileNameSafe(fileName);
  const fullPath = join(BACKUP_DIR, basename(fileName));
  await unlink(fullPath);
}

export function verifyOtpOrThrow(input: { code: string; totpEnabled: boolean; totpSecret: string | null; locale: string }) {
  const isIt = input.locale === "it";
  const code = input.code.trim();

  if (!/^\d{6}$/.test(code)) {
    throw new Error(isIt ? "Inserisci un codice OTP a 6 cifre." : "Enter a valid 6-digit OTP code.");
  }

  if (!input.totpEnabled || !input.totpSecret) {
    throw new Error(isIt ? "Attiva 2FA nel profilo per usare la Danger zone." : "Enable 2FA in profile settings to use Danger zone.");
  }

  const valid = verifyTotpCode({
    secret: input.totpSecret,
    code,
  });
  if (!valid) {
    throw new Error(isIt ? "Codice OTP non valido." : "Invalid OTP code.");
  }
}

export async function hardResetGymData(input: { keepAdminUserId: string }) {
  await prisma.$transaction(async (tx) => {
    await tx.lessonBooking.deleteMany({});
    await tx.lessonWaitlistEntry.deleteMany({});
    await tx.lesson.deleteMany({});
    await tx.courseScheduleSlot.deleteMany({});
    await tx.course.deleteMany({});
    await tx.userLessonTypeAccess.deleteMany({});
    await tx.lessonType.deleteMany({});

    await tx.notificationOutbox.deleteMany({});
    await tx.localNotification.deleteMany({});
    await tx.telegramLinkToken.deleteMany({});
    await tx.authToken.deleteMany({});
    await tx.webPushSubscription.deleteMany({
      where: {
        userId: { not: input.keepAdminUserId },
      },
    });
    await tx.session.deleteMany({
      where: {
        userId: { not: input.keepAdminUserId },
      },
    });

    await tx.user.deleteMany({
      where: {
        id: { not: input.keepAdminUserId },
      },
    });
  });
}
