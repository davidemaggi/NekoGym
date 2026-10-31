"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { toast } from "sonner";

import {
  changePasswordAction,
  disableTotpAction,
  enableTotpAction,
  requestEmailChangeAction,
  sendTestWebPushAction,
  startTotpSetupAction,
  startTelegramLinkAction,
  updateNotificationPreferencesAction,
} from "@/app/[locale]/(app)/settings/profile/actions";
import { PageBand } from "@/components/layout/page-band";
import { CheckRow, SegmentedTabs, SettingsSection, StatusNote } from "@/components/settings/settings-ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpCodeField } from "@/components/ui/otp-code-field";

type ProfileSettingsManagerProps = {
  locale: string;
  webPushPublicKey: string;
  labels: {
    title: string;
    subtitle: string;
    tabs: {
      security: string;
      notifications: string;
      telegram: string;
    };
    telegramTitle: string;
    telegramDescription: string;
    linkedStatus: string;
    notLinkedStatus: string;
    linkedChatIdLabel: string;
    linkedUsernameLabel: string;
    generateCodeCta: string;
    codeLabel: string;
    codeHint: string;
    openTelegramCta: string;
    qrHint: string;
    noBotConfiguredHint: string;
    commandLabel: string;
    expiresHint: string;
    generating: string;
    accountSecurityTitle: string;
    accountSecurityDescription: string;
    currentEmailLabel: string;
    emailVerifiedStatus: string;
    emailNotVerifiedStatus: string;
    pendingEmailLabel: string;
    newEmailLabel: string;
    newEmailPlaceholder: string;
    sendEmailChangeCta: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    updatePasswordCta: string;
    twoFactorTitle: string;
    twoFactorDescription: string;
    twoFactorEnabled: string;
    twoFactorDisabled: string;
    twoFactorSetupCta: string;
    twoFactorDisableCta: string;
    twoFactorVerifyCta: string;
    twoFactorCodeLabel: string;
    twoFactorSecretLabel: string;
    twoFactorOtpAuthLabel: string;
    twoFactorHint: string;
    cancelCta: string;
    webPushTitle: string;
    webPushDescription: string;
    webPushSupported: string;
    webPushNotSupported: string;
    webPushMissingKey: string;
    webPushEnabled: string;
    webPushDisabled: string;
    webPushEnableCta: string;
    webPushDisableCta: string;
    webPushProcessing: string;
    webPushTestCta: string;
    notificationPrefsTitle: string;
    notificationPrefsDescription: string;
    notificationEmailLabel: string;
    notificationTelegramLabel: string;
    notificationWebPushLabel: string;
    notificationPrefsSaveCta: string;
    notificationLocalAlwaysOnLabel: string;
    notificationsRetentionDaysLabel: string;
    notificationsRetentionDaysHint: string;
  };
  initialIdentity: {
    email: string;
    pendingEmail: string | null;
    isEmailVerified: boolean;
    totpEnabled: boolean;
    totpSecret: string | null;
    hasWebPushSubscription: boolean;
    notifyByEmail: boolean;
    notifyByTelegram: boolean;
    notifyByWebPush: boolean;
    notificationsRetentionDays: number;
  };
  initialTelegram: {
    chatId: string | null;
    username: string | null;
    linkToken: string | null;
    deepLink: string | null;
  };
};

type ActiveProfileTab = "security" | "notifications" | "telegram";

const fieldRowClass = "flex flex-col gap-2 sm:flex-row sm:items-end";

function SecurityTabContent(props: {
  labels: ProfileSettingsManagerProps["labels"];
  initialEmail: string;
  isEmailVerified: boolean;
  pendingEmail: string | null;
  newEmail: string;
  currentPassword: string;
  newPassword: string;
  totpEnabled: boolean;
  totpSecret: string | null;
  totpUri: string | null;
  totpQrDataUrl: string | null;
  isIdentityPending: boolean;
  isTotpPending: boolean;
  onChangeNewEmail: (value: string) => void;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onRequestEmailChange: () => void;
  onChangePassword: () => void;
  onStartTotpSetup: () => void;
  onEnableTotp: () => void;
  onDisableTotp: () => void;
}) {
  return (
    <div>
      <SettingsSection
        title={props.labels.currentEmailLabel}
        description={<span className="break-all text-[var(--foreground)]">{props.initialEmail}</span>}
        aside={
          <StatusNote tone={props.isEmailVerified ? "ok" : "warn"}>
            {props.isEmailVerified ? props.labels.emailVerifiedStatus : props.labels.emailNotVerifiedStatus}
          </StatusNote>
        }
      >
        {props.pendingEmail ? (
          <p className="text-[15px] text-[var(--warning-fg)]">
            {props.labels.pendingEmailLabel}: <span className="break-all font-semibold">{props.pendingEmail}</span>
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="newEmail">{props.labels.newEmailLabel}</Label>
          <div className={fieldRowClass}>
            <Input
              id="newEmail"
              type="email"
              autoComplete="email"
              value={props.newEmail}
              onChange={(event) => props.onChangeNewEmail(event.target.value)}
              placeholder={props.labels.newEmailPlaceholder}
              className="sm:max-w-sm"
            />
            <Button type="button" variant="outline" onClick={props.onRequestEmailChange} disabled={props.isIdentityPending || !props.newEmail}>
              {props.labels.sendEmailChangeCta}
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title={props.labels.updatePasswordCta}>
        <div className="grid gap-4 sm:max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">{props.labels.currentPasswordLabel}</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={props.currentPassword}
              onChange={(event) => props.onChangeCurrentPassword(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">{props.labels.newPasswordLabel}</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={props.newPassword}
              onChange={(event) => props.onChangeNewPassword(event.target.value)}
            />
          </div>
        </div>
        <Button type="button" onClick={props.onChangePassword} disabled={props.isIdentityPending || !props.currentPassword || props.newPassword.length < 8}>
          {props.labels.updatePasswordCta}
        </Button>
      </SettingsSection>

      <SettingsSection
        title={props.labels.twoFactorTitle}
        description={props.labels.twoFactorDescription}
        aside={
          <StatusNote tone={props.totpEnabled ? "ok" : "neutral"}>
            {props.totpEnabled ? props.labels.twoFactorEnabled : props.labels.twoFactorDisabled}
          </StatusNote>
        }
      >
        {!props.totpEnabled ? (
          <>
            {!props.totpSecret ? (
              <Button type="button" variant="outline" onClick={props.onStartTotpSetup} disabled={props.isTotpPending}>
                {props.labels.twoFactorSetupCta}
              </Button>
            ) : (
              <ol className="space-y-5">
                <li className="space-y-3">
                  <p className="text-[15px]">{props.labels.twoFactorHint}</p>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {props.totpQrDataUrl ? (
                      <Image
                        src={props.totpQrDataUrl}
                        alt={props.labels.twoFactorTitle}
                        width={180}
                        height={180}
                        unoptimized
                        className="h-[180px] w-[180px] shrink-0 rounded-xl bg-white p-2"
                      />
                    ) : null}
                    <dl className="min-w-0 space-y-2 text-[15px]">
                      <div>
                        <dt className="text-sm text-[var(--muted-foreground)]">{props.labels.twoFactorSecretLabel}</dt>
                        <dd className="break-all font-mono">{props.totpSecret}</dd>
                      </div>
                      {props.totpUri ? (
                        <div>
                          <dt className="text-sm text-[var(--muted-foreground)]">{props.labels.twoFactorOtpAuthLabel}</dt>
                          <dd className="break-all">
                            <a className="underline underline-offset-4" href={props.totpUri}>
                              {props.totpUri}
                            </a>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </li>
                <li>
                  <form id="totp-enable-form" className="space-y-3" onSubmit={(event) => event.preventDefault()}>
                    <Label htmlFor="totp-code">{props.labels.twoFactorCodeLabel}</Label>
                    <OtpCodeField id="totp-code" />
                    <Button type="button" onClick={props.onEnableTotp} disabled={props.isTotpPending}>
                      {props.labels.twoFactorVerifyCta}
                    </Button>
                  </form>
                </li>
              </ol>
            )}
          </>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]" disabled={props.isTotpPending}>
                {props.labels.twoFactorDisableCta}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{props.labels.twoFactorDisableCta}</AlertDialogTitle>
                <AlertDialogDescription>{props.labels.twoFactorDescription}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button type="button" variant="ghost">
                    {props.labels.cancelCta}
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button type="button" variant="destructive" onClick={props.onDisableTotp}>
                    {props.labels.twoFactorDisableCta}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </SettingsSection>
    </div>
  );
}

function NotificationsTabContent(props: {
  labels: ProfileSettingsManagerProps["labels"];
  supportsWebPush: boolean;
  unsupportedReasons: string[];
  webPushDiagnostics: {
    protocol: string;
    isStandalone: boolean;
    isIOS: boolean;
    permission: string;
    vapidConfigured: boolean;
  } | null;
  hasPushSubscription: boolean;
  isPushPending: boolean;
  isIdentityPending: boolean;
  notifyByEmail: boolean;
  notifyByTelegram: boolean;
  notifyByWebPush: boolean;
  notificationsRetentionDays: number;
  onToggleNotifyByEmail: (value: boolean) => void;
  onToggleNotifyByTelegram: (value: boolean) => void;
  onToggleNotifyByWebPush: (value: boolean) => void;
  onChangeRetentionDays: (value: number) => void;
  onEnableWebPush: () => void;
  onDisableWebPush: () => void;
  onSendWebPushTest: () => void;
  onSaveNotificationPreferences: () => void;
}) {
  return (
    <div>
      <SettingsSection title={props.labels.notificationPrefsTitle} description={props.labels.notificationPrefsDescription}>
        <fieldset className="-my-1">
          <legend className="sr-only">{props.labels.notificationPrefsTitle}</legend>
          <CheckRow checked={props.notifyByEmail} onChange={props.onToggleNotifyByEmail}>
            {props.labels.notificationEmailLabel}
          </CheckRow>
          <CheckRow checked={props.notifyByTelegram} onChange={props.onToggleNotifyByTelegram}>
            {props.labels.notificationTelegramLabel}
          </CheckRow>
          <CheckRow checked={props.notifyByWebPush} onChange={props.onToggleNotifyByWebPush}>
            {props.labels.notificationWebPushLabel}
          </CheckRow>
        </fieldset>
        <div className="space-y-1.5 pt-2">
          <Label htmlFor="notificationsRetentionDays">{props.labels.notificationsRetentionDaysLabel}</Label>
          <Input
            id="notificationsRetentionDays"
            type="number"
            inputMode="numeric"
            min={1}
            max={365}
            className="tabular w-28"
            value={String(props.notificationsRetentionDays)}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value || "1", 10);
              const next = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(365, parsed));
              props.onChangeRetentionDays(next);
            }}
          />
          <p className="text-sm text-[var(--muted-foreground)]">
            {props.labels.notificationLocalAlwaysOnLabel}. {props.labels.notificationsRetentionDaysHint}
          </p>
        </div>
        <Button type="button" onClick={props.onSaveNotificationPreferences} disabled={props.isIdentityPending}>
          {props.isIdentityPending ? props.labels.webPushProcessing : props.labels.notificationPrefsSaveCta}
        </Button>
      </SettingsSection>

      <SettingsSection
        title={props.labels.webPushTitle}
        description={props.labels.webPushDescription}
        aside={
          props.supportsWebPush ? (
            <StatusNote tone={props.hasPushSubscription ? "ok" : "neutral"}>
              {props.hasPushSubscription ? props.labels.webPushEnabled : props.labels.webPushDisabled}
            </StatusNote>
          ) : (
            <StatusNote tone="warn">{props.labels.webPushNotSupported}</StatusNote>
          )
        }
      >
        {!props.supportsWebPush ? (
          <details className="text-sm text-[var(--muted-foreground)]">
            <summary className="inline-flex min-h-11 items-center font-semibold text-[var(--foreground)]">Debug</summary>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {props.unsupportedReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
              <li>Protocol: {props.webPushDiagnostics?.protocol ?? "n/a"}</li>
              <li>Standalone app: {props.webPushDiagnostics?.isStandalone ? "yes" : "no"}</li>
              <li>iOS device: {props.webPushDiagnostics?.isIOS ? "yes" : "no"}</li>
              <li>Permission: {props.webPushDiagnostics?.permission ?? "n/a"}</li>
              <li>VAPID public key: {props.webPushDiagnostics?.vapidConfigured ? "configured" : "missing"}</li>
            </ul>
          </details>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {props.hasPushSubscription ? (
            <>
              <Button type="button" variant="outline" onClick={props.onSendWebPushTest} disabled={props.isPushPending}>
                {props.isPushPending ? props.labels.webPushProcessing : props.labels.webPushTestCta}
              </Button>
              <Button type="button" variant="ghost" onClick={props.onDisableWebPush} disabled={props.isPushPending}>
                {props.labels.webPushDisableCta}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={props.onEnableWebPush} disabled={props.isPushPending}>
              {props.isPushPending ? props.labels.webPushProcessing : props.labels.webPushEnableCta}
            </Button>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}

function TelegramTabContent(props: {
  labels: ProfileSettingsManagerProps["labels"];
  state: ProfileSettingsManagerProps["initialTelegram"];
  linkCommand: string | null;
  qrImageUrl: string | null;
  isPending: boolean;
  onGenerateCode: () => void;
}) {
  return (
    <div>
      <SettingsSection
        title={props.labels.telegramTitle}
        description={props.labels.telegramDescription}
        aside={
          <StatusNote tone={props.state.chatId ? "ok" : "neutral"}>
            {props.state.chatId ? props.labels.linkedStatus : props.labels.notLinkedStatus}
          </StatusNote>
        }
      >
        {props.state.chatId ? (
          <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-[auto_1fr]">
            <dt className="text-[var(--muted-foreground)]">{props.labels.linkedChatIdLabel}</dt>
            <dd className="font-mono">{props.state.chatId}</dd>
            {props.state.username ? (
              <>
                <dt className="text-[var(--muted-foreground)]">{props.labels.linkedUsernameLabel}</dt>
                <dd>@{props.state.username}</dd>
              </>
            ) : null}
          </dl>
        ) : null}

        <div className="space-y-1.5">
          <Button type="button" variant={props.state.linkToken ? "outline" : "default"} onClick={props.onGenerateCode} disabled={props.isPending}>
            {props.isPending ? props.labels.generating : props.labels.generateCodeCta}
          </Button>
          <p className="text-sm text-[var(--muted-foreground)]">{props.labels.expiresHint}</p>
        </div>
      </SettingsSection>

      {props.state.linkToken ? (
        <SettingsSection title={props.labels.codeLabel} description={props.labels.codeHint}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="min-w-0 space-y-3">
              <p className="inline-block rounded-xl bg-[var(--muted)] px-4 py-2.5 font-mono text-[1.375rem] font-semibold tracking-wider">
                {props.state.linkToken}
              </p>
              {props.linkCommand ? (
                <p className="text-[15px] text-[var(--muted-foreground)]">
                  {props.labels.commandLabel}: <span className="font-mono text-[var(--foreground)]">{props.linkCommand}</span>
                </p>
              ) : null}
              {props.state.deepLink ? (
                <Link
                  href={props.state.deepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-[15px] font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
                >
                  {props.labels.openTelegramCta}
                </Link>
              ) : (
                <p className="text-[15px] text-[var(--warning-fg)]">{props.labels.noBotConfiguredHint}</p>
              )}
            </div>
            {props.qrImageUrl ? (
              <figure className="shrink-0">
                <Image src={props.qrImageUrl} alt={props.labels.qrHint} width={180} height={180} unoptimized className="h-[180px] w-[180px] rounded-xl bg-white p-2" />
                <figcaption className="mt-2 max-w-[180px] text-sm text-[var(--muted-foreground)]">{props.labels.qrHint}</figcaption>
              </figure>
            ) : null}
          </div>
        </SettingsSection>
      ) : null}
    </div>
  );
}

export function ProfileSettingsManager({ locale, labels, webPushPublicKey, initialIdentity, initialTelegram }: ProfileSettingsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isIdentityPending, startIdentityTransition] = useTransition();
  const [state, setState] = useState(initialTelegram);
  const [qrVersion, setQrVersion] = useState(0);
  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState(initialIdentity.pendingEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [totpEnabled, setTotpEnabled] = useState(initialIdentity.totpEnabled);
  const [totpSecret, setTotpSecret] = useState(initialIdentity.totpSecret);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpQrDataUrl, setTotpQrDataUrl] = useState<string | null>(null);
  const [isTotpPending, startTotpTransition] = useTransition();
  const [isPushPending, startPushTransition] = useTransition();
  const [hasPushSubscription, setHasPushSubscription] = useState(initialIdentity.hasWebPushSubscription);
  const [notifyByEmail, setNotifyByEmail] = useState(initialIdentity.notifyByEmail);
  const [notifyByTelegram, setNotifyByTelegram] = useState(initialIdentity.notifyByTelegram);
  const [notifyByWebPush, setNotifyByWebPush] = useState(initialIdentity.notifyByWebPush);
  const [notificationsRetentionDays, setNotificationsRetentionDays] = useState(initialIdentity.notificationsRetentionDays);
  const [activeTab, setActiveTab] = useState<ActiveProfileTab>("security");
  const webPushDiagnostics = useMemo(() => {
    if (typeof window === "undefined") return null;

    const hasNotification = "Notification" in window;
    const hasServiceWorker = "serviceWorker" in navigator;
    const hasPushManager = "PushManager" in window;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);

    return {
      protocol: window.location.protocol,
      isSecureContext: window.isSecureContext,
      hasNotification,
      hasServiceWorker,
      hasPushManager,
      isStandalone,
      isIOS,
      permission: hasNotification ? Notification.permission : "unsupported",
      vapidConfigured: Boolean(webPushPublicKey),
    };
  }, [webPushPublicKey]);

  const unsupportedReasons = useMemo(() => {
    if (!webPushDiagnostics) return [] as string[];

    const reasons: string[] = [];
    if (!webPushDiagnostics.isSecureContext) reasons.push("Not a secure context (HTTPS or localhost required)");
    if (!webPushDiagnostics.hasNotification) reasons.push("Notification API not available");
    if (!webPushDiagnostics.hasServiceWorker) reasons.push("Service Worker API not available");
    if (!webPushDiagnostics.hasPushManager) reasons.push("PushManager API not available");
    if (webPushDiagnostics.isIOS && !webPushDiagnostics.isStandalone) {
      reasons.push("On iOS you must open the app from Home Screen (standalone) to request push permission");
    }
    return reasons;
  }, [webPushDiagnostics]);

  const supportsWebPush = unsupportedReasons.length === 0;

  useEffect(() => {
    if (!webPushDiagnostics || supportsWebPush) return;

    console.warn("[webpush] Unsupported context diagnostics", {
      ...webPushDiagnostics,
      reasons: unsupportedReasons,
    });
  }, [supportsWebPush, unsupportedReasons, webPushDiagnostics]);

  const linkCommand = state.linkToken ? `/link ${state.linkToken}` : null;
  const qrImageUrl = useMemo(() => {
    if (!state.linkToken || !state.deepLink) return null;
    return `/api/telegram/link/qr?v=${qrVersion}`;
  }, [state.linkToken, state.deepLink, qrVersion]);

  function handleGenerateCode() {
    const formData = new FormData();
    formData.set("locale", locale);

    startTransition(async () => {
      const result = await startTelegramLinkAction(formData);
      if (!result.ok || !result.token) {
        toast.error(result.message);
        return;
      }

      setState((prev) => ({
        ...prev,
        linkToken: result.token ?? null,
        deepLink: result.deepLink ?? null,
      }));
      setQrVersion((prev) => prev + 1);
      setActiveTab("telegram");
      toast.success(result.message);
    });
  }

  function handleRequestEmailChange() {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("newEmail", newEmail);

    startIdentityTransition(async () => {
      const result = await requestEmailChangeAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setPendingEmail(newEmail.trim().toLowerCase());
      setNewEmail("");
      toast.success(result.message);
    });
  }

  function handleChangePassword() {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("currentPassword", currentPassword);
    formData.set("newPassword", newPassword);

    startIdentityTransition(async () => {
      const result = await changePasswordAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      toast.success(result.message);
    });
  }

  function handleStartTotpSetup() {
    const formData = new FormData();
    formData.set("locale", locale);

    startTotpTransition(async () => {
      const result = await startTotpSetupAction(formData);
      if (!result.ok || !result.secret) {
        toast.error(result.message);
        return;
      }

      setTotpSecret(result.secret);
      setTotpUri(result.otpauthUri ?? null);
      if (result.otpauthUri) {
        const qrDataUrl = await QRCode.toDataURL(result.otpauthUri, {
          width: 220,
          margin: 1,
          errorCorrectionLevel: "M",
        });
        setTotpQrDataUrl(qrDataUrl);
      } else {
        setTotpQrDataUrl(null);
      }
      setTotpEnabled(false);
      toast.success(result.message);
    });
  }

  function handleEnableTotp() {
    const form = document.getElementById("totp-enable-form") as HTMLFormElement | null;
    if (!form) return;
    const formData = new FormData(form);
    formData.set("locale", locale);

    startTotpTransition(async () => {
      const result = await enableTotpAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setTotpEnabled(true);
      toast.success(result.message);
    });
  }

  function handleDisableTotp() {
    const formData = new FormData();
    formData.set("locale", locale);

    startTotpTransition(async () => {
      const result = await disableTotpAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setTotpEnabled(false);
      setTotpSecret(null);
      setTotpUri(null);
      setTotpQrDataUrl(null);
      toast.success(result.message);
    });
  }

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
  }

  function handleEnableWebPush() {
    startPushTransition(async () => {
      if (!supportsWebPush) {
        const detail = unsupportedReasons[0] ?? "Unknown unsupported browser context";
        toast.error(`${labels.webPushNotSupported}: ${detail}`);
        return;
      }

      if (webPushDiagnostics?.isIOS && !webPushDiagnostics.isStandalone) {
        toast.error("Su iOS devi aprire l'app dalla Home (Aggiungi a schermata Home) per abilitare le web push.");
        return;
      }

      const vapidPublicKey = webPushPublicKey;
      if (!vapidPublicKey) {
        toast.error(labels.webPushMissingKey);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(`${labels.webPushNotSupported}: Notification permission is ${permission}`);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        const subscription =
          existing ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
          }));

        const response = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        if (!response.ok) {
          const responseBody = await response.text();
          console.error("[webpush] subscribe API failed", { status: response.status, responseBody });
          toast.error(`${labels.webPushNotSupported}: subscribe API failed (${response.status})`);
          return;
        }

        setHasPushSubscription(true);
        toast.success(labels.webPushEnabled);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown push subscription error";
        console.error("[webpush] enable failed", error);
        toast.error(`${labels.webPushNotSupported}: ${message}`);
      }
    });
  }

  function handleDisableWebPush() {
    startPushTransition(async () => {
      if (!("serviceWorker" in navigator)) {
        toast.error(labels.webPushNotSupported);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setHasPushSubscription(false);
        toast.success(labels.webPushDisabled);
        return;
      }

      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await subscription.unsubscribe();
      setHasPushSubscription(false);
      toast.success(labels.webPushDisabled);
    });
  }

  function handleSendWebPushTest() {
    const formData = new FormData();
    formData.set("locale", locale);

    startPushTransition(async () => {
      const result = await sendTestWebPushAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  function handleSaveNotificationPreferences() {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("notifyByEmail", notifyByEmail ? "true" : "false");
    formData.set("notifyByTelegram", notifyByTelegram ? "true" : "false");
    formData.set("notifyByWebPush", notifyByWebPush ? "true" : "false");
    formData.set("notificationsRetentionDays", String(notificationsRetentionDays));

    startIdentityTransition(async () => {
      const result = await updateNotificationPreferencesAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
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
            ["security", labels.tabs.security],
            ["notifications", labels.tabs.notifications],
            ["telegram", labels.tabs.telegram],
          ]}
        />
      </PageBand>

      <div className="max-w-2xl">

      {activeTab === "security" ? (
        <SecurityTabContent
          labels={labels}
          initialEmail={initialIdentity.email}
          isEmailVerified={initialIdentity.isEmailVerified}
          pendingEmail={pendingEmail}
          newEmail={newEmail}
          currentPassword={currentPassword}
          newPassword={newPassword}
          totpEnabled={totpEnabled}
          totpSecret={totpSecret}
          totpUri={totpUri}
          totpQrDataUrl={totpQrDataUrl}
          isIdentityPending={isIdentityPending}
          isTotpPending={isTotpPending}
          onChangeNewEmail={setNewEmail}
          onChangeCurrentPassword={setCurrentPassword}
          onChangeNewPassword={setNewPassword}
          onRequestEmailChange={handleRequestEmailChange}
          onChangePassword={handleChangePassword}
          onStartTotpSetup={handleStartTotpSetup}
          onEnableTotp={handleEnableTotp}
          onDisableTotp={handleDisableTotp}
        />
      ) : null}

      {activeTab === "notifications" ? (
        <NotificationsTabContent
          labels={labels}
          supportsWebPush={supportsWebPush}
          unsupportedReasons={unsupportedReasons}
          webPushDiagnostics={webPushDiagnostics}
          hasPushSubscription={hasPushSubscription}
          isPushPending={isPushPending}
          isIdentityPending={isIdentityPending}
          notifyByEmail={notifyByEmail}
          notifyByTelegram={notifyByTelegram}
          notifyByWebPush={notifyByWebPush}
          notificationsRetentionDays={notificationsRetentionDays}
          onToggleNotifyByEmail={setNotifyByEmail}
          onToggleNotifyByTelegram={setNotifyByTelegram}
          onToggleNotifyByWebPush={setNotifyByWebPush}
          onChangeRetentionDays={setNotificationsRetentionDays}
          onEnableWebPush={handleEnableWebPush}
          onDisableWebPush={handleDisableWebPush}
          onSendWebPushTest={handleSendWebPushTest}
          onSaveNotificationPreferences={handleSaveNotificationPreferences}
        />
      ) : null}

      {activeTab === "telegram" ? (
        <TelegramTabContent
          labels={labels}
          state={state}
          linkCommand={linkCommand}
          qrImageUrl={qrImageUrl}
          isPending={isPending}
          onGenerateCode={handleGenerateCode}
        />
      ) : null}
      </div>
    </div>
  );
}


