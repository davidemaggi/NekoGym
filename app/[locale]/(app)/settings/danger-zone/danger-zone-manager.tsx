"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpCodeField } from "@/components/ui/otp-code-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    delete: isIt ? "Cancella" : "Delete",
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
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{labels.subtitle}</p>
      </header>

      <Tabs defaultValue="backup" className="space-y-3">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="restore">Restore</TabsTrigger>
          <TabsTrigger value="reset">Reset</TabsTrigger>
        </TabsList>

        <TabsContent value="backup" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{labels.backupTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">{labels.backupDescription}</p>
              <Button type="button" onClick={onCreateBackup} disabled={isCreatePending}>
                {isCreatePending ? labels.backupCreating : labels.backupCreateCta}
              </Button>
              <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
                <p className="text-sm font-medium">{labels.uploadTitle}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{labels.uploadDescription}</p>
                <form className="space-y-2" onSubmit={onUploadSubmit}>
                  <div className="space-y-1">
                    <Label htmlFor="backupFile">{labels.uploadFileLabel}</Label>
                    <Input id="backupFile" name="backupFile" type="file" required accept=".sqlite,.db,.sqlite3" />
                  </div>
                  <Button type="submit" variant="outline" disabled={isUploadPending}>
                    {isUploadPending ? labels.uploading : labels.uploadCta}
                  </Button>
                </form>
              </div>

              {backups.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">{labels.backupEmpty}</p>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div key={backup.fileName} className="rounded-md border border-[var(--surface-border)] p-2 text-sm">
                      <p className="font-medium">{backup.fileName}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {labels.backupDateLabel}: {formatDate(new Date(backup.createdAtIso), locale)} · {labels.backupSizeLabel}:{" "}
                        {formatBytes(backup.sizeBytes, locale)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <a
                          href={`/${locale}/settings/danger-zone/download?file=${encodeURIComponent(backup.fileName)}`}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--surface-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                        >
                          {confirmLabels.download}
                        </a>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setBackupToDelete(backup.fileName)}
                          disabled={isDeleteBackupPending}
                        >
                          {confirmLabels.delete}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>{labels.restoreTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">{labels.restoreDescription}</p>
              <form className="space-y-3" onSubmit={onRestoreSubmit}>
                <div className="space-y-1">
                  <Label htmlFor="backupFileName">{labels.restoreBackupLabel}</Label>
                  <select
                    id="backupFileName"
                    name="backupFileName"
                    required
                    value={restoreBackupFileName}
                    onChange={(event) => setRestoreBackupFileName(event.target.value)}
                    className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
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
                <div className="space-y-1">
                  <Label>{labels.restoreOtpLabel}</Label>
                  <OtpCodeField name="otpCode" value={restoreOtpCode} onChange={setRestoreOtpCode} />
                </div>
                <Button type="submit" variant="outline" disabled={!canSubmitRestore}>
                  {isRestorePending ? labels.restoring : labels.restoreCta}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reset" className="mt-0">
          <Card className="border-[var(--danger-hover)]">
            <CardHeader>
              <CardTitle>{labels.resetTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-[var(--danger-fg)]">{labels.resetDescription}</p>
              <form className="space-y-3" onSubmit={onResetSubmit}>
                <div className="space-y-1">
                  <Label htmlFor="confirmation">{labels.resetConfirmationLabel}</Label>
                  <Input
                    id="confirmation"
                    name="confirmation"
                    required
                    placeholder="RESET"
                    autoComplete="off"
                    value={resetConfirmation}
                    onChange={(event) => setResetConfirmation(event.target.value)}
                  />
                  <p className="text-xs text-[var(--muted-foreground)]">{labels.resetConfirmationHint}</p>
                </div>
                <div className="space-y-1">
                  <Label>{labels.resetOtpLabel}</Label>
                  <OtpCodeField name="otpCode" value={resetOtpCode} onChange={setResetOtpCode} />
                </div>
                <Button type="submit" variant="destructive" disabled={!canSubmitReset}>
                  {isResetPending ? labels.resetting : labels.resetCta}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <Button type="button" variant="outline">
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
            {backupToDelete ? <AlertDialogDescription>{backupToDelete}</AlertDialogDescription> : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
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
    </section>
  );
}
