"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createBackupAction, hardResetAction, restoreBackupAction, uploadBackupAction } from "@/app/[locale]/(app)/settings/danger-zone/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  }).format(date);
}

export function DangerZoneManager({ locale, backups, labels }: DangerZoneManagerProps) {
  const router = useRouter();
  const [isCreatePending, startCreateTransition] = useTransition();
  const [isUploadPending, startUploadTransition] = useTransition();
  const [isRestorePending, startRestoreTransition] = useTransition();
  const [isResetPending, startResetTransition] = useTransition();

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
    const proceed = window.confirm(labels.restoreWarningConfirm);
    if (!proceed) {
      return;
    }
    const backupFirst = window.confirm(labels.restoreBackupPromptConfirm);
    formData.set("createBackupFirst", backupFirst ? "1" : "0");
    formData.set("locale", locale);

    startRestoreTransition(async () => {
      const result = await restoreBackupAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function onResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const proceed = window.confirm(labels.resetWarningConfirm);
    if (!proceed) {
      return;
    }
    const backupFirst = window.confirm(labels.resetBackupPromptConfirm);
    formData.set("createBackupFirst", backupFirst ? "1" : "0");
    formData.set("locale", locale);

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

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{labels.subtitle}</p>
      </header>

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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                defaultValue={backups[0]?.fileName ?? ""}
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
              <OtpCodeField name="otpCode" />
            </div>
            <Button type="submit" variant="outline" disabled={isRestorePending || backups.length === 0}>
              {isRestorePending ? labels.restoring : labels.restoreCta}
            </Button>
          </form>
        </CardContent>
      </Card>

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
              />
              <p className="text-xs text-[var(--muted-foreground)]">{labels.resetConfirmationHint}</p>
            </div>
            <div className="space-y-1">
              <Label>{labels.resetOtpLabel}</Label>
              <OtpCodeField name="otpCode" />
            </div>
            <Button type="submit" variant="destructive" disabled={isResetPending}>
              {isResetPending ? labels.resetting : labels.resetCta}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
