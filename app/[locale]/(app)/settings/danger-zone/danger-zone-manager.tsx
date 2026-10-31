"use client";

import { getAppDateTimeConfig } from "@/lib/date-time";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, DatabaseBackup, Download, Trash2, TriangleAlert, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  createBackupAction,
  deleteBackupAction,
  hardResetAction,
  restoreBackupAction,
  uploadBackupAction,
} from "@/app/[locale]/(app)/settings/danger-zone/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageBand } from "@/components/layout/page-band";
import { SegmentedTabs, SettingsSection } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpCodeField } from "@/components/ui/otp-code-field";

type DangerZoneManagerProps = {
  locale: string;
  backups: Array<{
    fileName: string;
    createdAtIso: string;
    sizeBytes: number;
  }>;
  labels: {
    title: string;
    subtitle: string;
    backupTitle: string;
    backupDescription: string;
    uploadTitle: string;
    uploadDescription: string;
    uploadFileLabel: string;
    uploadCta: string;
    uploading: string;
    backupEmpty: string;
    backupCreateCta: string;
    backupCreating: string;
    restoreTitle: string;
    restoreDescription: string;
    restoreBackupLabel: string;
    restoreBackupPlaceholder: string;
    restoreOtpLabel: string;
    restoreWarningConfirm: string;
    restoreBackupPromptConfirm: string;
    restoreCta: string;
    restoring: string;
    resetTitle: string;
    resetDescription: string;
    resetConfirmationLabel: string;
    resetConfirmationHint: string;
    resetOtpLabel: string;
    resetWarningConfirm: string;
    resetBackupPromptConfirm: string;
    resetCta: string;
    resetting: string;
    backupDateLabel: string;
    backupSizeLabel: string;
  };
};

function formatBytes(bytes: number, locale: string) {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-US", {
    maximumFractionDigits: 2,
    style: "unit",
    unit: "megabyte",
  }).format(bytes / 1024 / 1024);
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: getAppDateTimeConfig().timeZone,
  }).format(date);
}

export function DangerZoneManager({ locale, backups, labels }: DangerZoneManagerProps) {
  const router = useRouter();
  const [isCreatePending, startCreateTransition] = useTransition();
  const [isUploadPending, startUploadTransition] = useTransition();
  const [isRestorePending, startRestoreTransition] = useTransition();
  const [isResetPending, startResetTransition] = useTransition();
  const [isDeleteBackupPending, startDeleteBackupTransition] = useTransition();
  const [restoreBackupFileName, setRestoreBackupFileName] = useState(backups[0]?.fileName ?? "");
  const [restoreOtpCode, setRestoreOtpCode] = useState("");
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetOtpCode, setResetOtpCode] = useState("");
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const [openBackup, setOpenBackup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"backup" | "restore" | "reset">("backup");
  const openBackupItem = backups.find((backup) => backup.fileName === openBackup);
  const [pendingConfirm, setPendingConfirm] = useState<{ type: "restore" | "reset"; formData: FormData } | null>(
    null
  );

  const isIt = locale === "it";
  const confirmLabels = {
    cancel: isIt ? "Annulla" : "Cancel",
    proceedWithoutBackup: isIt ? "Procedi senza backup" : "Proceed without backup",
    proceedWithBackup: isIt ? "Procedi con backup" : "Proceed with backup",
    restoreTitle: isIt ? "Conferma restore" : "Confirm restore",
    resetTitle: isIt ? "Conferma reset" : "Confirm reset",
    deleteBackupTitle: isIt ? "Conferma eliminazione backup" : "Confirm backup deletion",
    deleteBackupDescription: isIt
      ? "Questa azione elimina definitivamente il file backup selezionato."
      : "This action permanently deletes the selected backup file.",
    deleteBackupCta: isIt ? "Elimina backup" : "Delete backup",
    download: isIt ? "Scarica" : "Download",
    delete: isIt ? "Elimina" : "Delete",
    tabBackup: "Backup",
    tabRestore: isIt ? "Ripristino" : "Restore",
    tabReset: "Reset",
  };
  const canSubmitRestore =
    backups.length > 0 &&
    restoreBackupFileName.trim().length > 0 &&
    restoreOtpCode.length === 6 &&
    !isRestorePending &&
    !isResetPending;
  const canSubmitReset =
    resetConfirmation.trim().length > 0 &&
    resetOtpCode.length === 6 &&
    !isResetPending &&
    !isRestorePending;

  function onCreateBackup() {
    const formData = new FormData();
    formData.set("locale", locale);

    startCreateTransition(async () => {
      const result = await createBackupAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function onUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("locale", locale);

    startUploadTransition(async () => {
      const result = await uploadBackupAction(formData);
      if (result.ok) {
        toast.success(result.message);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function onRestoreSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPendingConfirm({ type: "restore", formData });
  }

  function onResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPendingConfirm({ type: "reset", formData });
  }

  function onConfirmAction(createBackupFirst: boolean) {
    if (!pendingConfirm) return;
    const { type, formData } = pendingConfirm;
    setPendingConfirm(null);

    formData.set("createBackupFirst", createBackupFirst ? "1" : "0");
    formData.set("locale", locale);

    if (type === "restore") {
      startRestoreTransition(async () => {
        const result = await restoreBackupAction(formData);
        if (result.ok) {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      });
      return;
    }

    startResetTransition(async () => {
      const result = await hardResetAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function onDeleteBackupConfirm() {
    if (!backupToDelete) return;
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("backupFileName", backupToDelete);

    startDeleteBackupTransition(async () => {
      const result = await deleteBackupAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setBackupToDelete(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-5">
      <PageBand title={labels.title} description={labels.subtitle}>
        <SegmentedTabs
          className="mt-5"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            ["backup", confirmLabels.tabBackup],
            ["restore", confirmLabels.tabRestore],
            ["reset", confirmLabels.tabReset],
          ]}
        />
      </PageBand>

      <div className="max-w-2xl">
        {activeTab === "backup" ? (
          <>
            <SettingsSection title={labels.backupTitle} description={labels.backupDescription}>
              <Button type="button" onClick={onCreateBackup} disabled={isCreatePending}>
                <DatabaseBackup size={18} aria-hidden="true" />
                {isCreatePending ? labels.backupCreating : labels.backupCreateCta}
              </Button>
              {backups.length === 0 ? (
                <p className="text-[15px] text-[var(--muted-foreground)]">{labels.backupEmpty}</p>
              ) : (
                <ul className="border-t border-[var(--rule)]">
                  {backups.map((backup) => (
                    <li key={backup.fileName} className="border-b border-[var(--rule)]">
                      <button
                        type="button"
                        onClick={() => setOpenBackup(backup.fileName)}
                        className="flex min-h-16 w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[var(--surface)]/60"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block break-all font-mono text-[15px] font-semibold">{backup.fileName}</span>
                          <span className="tabular mt-0.5 block text-sm text-[var(--muted-foreground)]">
                            {formatDate(new Date(backup.createdAtIso), locale)} · {formatBytes(backup.sizeBytes, locale)}
                          </span>
                        </span>
                        <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-[var(--muted-foreground)]" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </SettingsSection>
            <SettingsSection title={labels.uploadTitle} description={labels.uploadDescription}>
              <form className="space-y-4" onSubmit={onUploadSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="backupFile">{labels.uploadFileLabel}</Label>
                  <Input id="backupFile" name="backupFile" type="file" required accept=".sqlite,.db,.sqlite3" className="h-auto py-1.5 file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-[var(--muted)] file:px-3 file:text-[15px] file:font-semibold file:text-[var(--foreground)]" />
                </div>
                <Button type="submit" variant="outline" disabled={isUploadPending}>
                  <Upload size={16} aria-hidden="true" />
                  {isUploadPending ? labels.uploading : labels.uploadCta}
                </Button>
              </form>
            </SettingsSection>
          </>
        ) : null}

        {activeTab === "restore" ? (
          <SettingsSection title={labels.restoreTitle} description={labels.restoreDescription}>
            <form className="space-y-4" onSubmit={onRestoreSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="backupFileName">{labels.restoreBackupLabel}</Label>
                <select
                  id="backupFileName"
                  name="backupFileName"
                  required
                  value={restoreBackupFileName}
                  onChange={(event) => setRestoreBackupFileName(event.target.value)}
                  className="ui-select w-full"
                >
                  {backups.length === 0 ? (
                    <option value="">{labels.restoreBackupPlaceholder}</option>
                  ) : (
                    backups.map((backup) => (
                      <option key={backup.fileName} value={backup.fileName}>
                        {backup.fileName}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="restore-otp">{labels.restoreOtpLabel}</Label>
                <OtpCodeField id="restore-otp" name="otpCode" value={restoreOtpCode} onChange={setRestoreOtpCode} />
              </div>
              <Button type="submit" variant="outline" disabled={!canSubmitRestore}>
                {isRestorePending ? labels.restoring : labels.restoreCta}
              </Button>
            </form>
          </SettingsSection>
        ) : null}

        {activeTab === "reset" ? (
          <SettingsSection title={labels.resetTitle}>
            <p className="flex gap-2.5 rounded-xl bg-[var(--danger-bg)] px-4 py-3 text-[15px] font-semibold text-[var(--danger-fg)]">
              <TriangleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
              {labels.resetDescription}
            </p>
            <form className="space-y-4" onSubmit={onResetSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="confirmation">{labels.resetConfirmationLabel}</Label>
                <Input
                  id="confirmation"
                  name="confirmation"
                  required
                  placeholder="RESET"
                  autoComplete="off"
                  aria-describedby="confirmation-hint"
                  className="sm:max-w-xs"
                  value={resetConfirmation}
                  onChange={(event) => setResetConfirmation(event.target.value)}
                />
                <p id="confirmation-hint" className="text-sm text-[var(--muted-foreground)]">{labels.resetConfirmationHint}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-otp">{labels.resetOtpLabel}</Label>
                <OtpCodeField id="reset-otp" name="otpCode" value={resetOtpCode} onChange={setResetOtpCode} />
              </div>
              <Button type="submit" variant="destructive" disabled={!canSubmitReset}>
                {isResetPending ? labels.resetting : labels.resetCta}
              </Button>
            </form>
          </SettingsSection>
        ) : null}
      </div>

      <Dialog open={Boolean(openBackup)} onOpenChange={(open) => !open && setOpenBackup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><span className="break-all font-mono">{openBackupItem?.fileName}</span></DialogTitle>
            {openBackupItem ? (
              <DialogDescription>
                <span className="tabular">
                  {labels.backupDateLabel}: {formatDate(new Date(openBackupItem.createdAtIso), locale)} · {labels.backupSizeLabel}:{" "}
                  {formatBytes(openBackupItem.sizeBytes, locale)}
                </span>
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <DialogFooter>
            {/* Deleting is deliberate: it lives here, away from the list. */}
            <Button
              type="button"
              variant="ghost"
              className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)] sm:mr-auto"
              disabled={isDeleteBackupPending}
              onClick={() => {
                setBackupToDelete(openBackup);
                setOpenBackup(null);
              }}
            >
              <Trash2 size={18} aria-hidden="true" />
              {confirmLabels.delete}
            </Button>
            {openBackupItem ? (
              <a
                href={`/${locale}/settings/danger-zone/download?file=${encodeURIComponent(openBackupItem.fileName)}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-[15px] font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
              >
                <Download size={18} aria-hidden="true" />
                {confirmLabels.download}
              </a>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingConfirm)} onOpenChange={(open) => !open && setPendingConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingConfirm?.type === "reset" ? confirmLabels.resetTitle : confirmLabels.restoreTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingConfirm?.type === "reset" ? labels.resetWarningConfirm : labels.restoreWarningConfirm}
            </AlertDialogDescription>
            <AlertDialogDescription>
              {pendingConfirm?.type === "reset" ? labels.resetBackupPromptConfirm : labels.restoreBackupPromptConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="ghost">
                {confirmLabels.cancel}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => onConfirmAction(false)}
                disabled={isRestorePending || isResetPending}
              >
                {confirmLabels.proceedWithoutBackup}
              </Button>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant={pendingConfirm?.type === "reset" ? "destructive" : "default"}
                onClick={() => onConfirmAction(true)}
                disabled={isRestorePending || isResetPending}
              >
                {confirmLabels.proceedWithBackup}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(backupToDelete)} onOpenChange={(open) => !open && setBackupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmLabels.deleteBackupTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmLabels.deleteBackupDescription}</AlertDialogDescription>
            {backupToDelete ? <AlertDialogDescription><span className="break-all font-mono">{backupToDelete}</span></AlertDialogDescription> : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="ghost">
                {confirmLabels.cancel}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={onDeleteBackupConfirm}
                disabled={isDeleteBackupPending}
              >
                {confirmLabels.deleteBackupCta}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
