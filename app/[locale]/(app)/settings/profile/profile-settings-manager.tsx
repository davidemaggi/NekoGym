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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpCodeField } from "@/components/ui/otp-code-field";

type ProfileSettingsManagerProps = {
  locale: string;
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

function ProfileTabs({
  activeTab,
  onChange,
  labels,
}: {
  activeTab: ActiveProfileTab;
  onChange: (tab: ActiveProfileTab) => void;
  labels: ProfileSettingsManagerProps["labels"]["tabs"];
}) {
  return (
    <div className="flex border-b border-[var(--surface-border)]">
      {(["security", "notifications", "telegram"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={[
            "px-3 py-2 text-sm",
            activeTab === tab ? "border-b-2 border-[var(--primary)] font-medium" : "text-[var(--muted-foreground)]",
          ].join(" ")}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}

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
    <Card>
      <CardHeader>
        <CardTitle>{props.labels.accountSecurityTitle}</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">{props.labels.accountSecurityDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-[var(--surface-border)] p-3">
          <p className="text-sm font-medium">
            {props.labels.currentEmailLabel}: {props.initialEmail}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {props.isEmailVerified ? props.labels.emailVerifiedStatus : props.labels.emailNotVerifiedStatus}
          </p>
          {props.pendingEmail ? (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              {props.labels.pendingEmailLabel}: {props.pendingEmail}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
          <Label htmlFor="newEmail">{props.labels.newEmailLabel}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="newEmail"
              type="email"
              value={props.newEmail}
              onChange={(event) => props.onChangeNewEmail(event.target.value)}
              placeholder={props.labels.newEmailPlaceholder}
            />
            <Button type="button" variant="outline" onClick={props.onRequestEmailChange} disabled={props.isIdentityPending || !props.newEmail}>
              {props.labels.sendEmailChangeCta}
            </Button>
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
          <Label htmlFor="currentPassword">{props.labels.currentPasswordLabel}</Label>
          <Input
            id="currentPassword"
            type="password"
            value={props.currentPassword}
            onChange={(event) => props.onChangeCurrentPassword(event.target.value)}
          />
          <Label htmlFor="newPassword">{props.labels.newPasswordLabel}</Label>
          <Input
            id="newPassword"
            type="password"
            minLength={8}
            value={props.newPassword}
            onChange={(event) => props.onChangeNewPassword(event.target.value)}
          />
          <Button type="button" onClick={props.onChangePassword} disabled={props.isIdentityPending || !props.currentPassword || props.newPassword.length < 8}>
            {props.labels.updatePasswordCta}
          </Button>
        </div>

        <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
          <p className="text-sm font-medium">{props.labels.twoFactorTitle}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{props.labels.twoFactorDescription}</p>
          <p className="text-xs font-medium">
            {props.totpEnabled ? props.labels.twoFactorEnabled : props.labels.twoFactorDisabled}
          </p>

          {!props.totpEnabled ? (
            <>
              <Button type="button" variant="outline" onClick={props.onStartTotpSetup} disabled={props.isTotpPending}>
                {props.labels.twoFactorSetupCta}
              </Button>

              {props.totpSecret ? (
                <div className="space-y-2 rounded-md border border-[var(--surface-border)] bg-[var(--muted)]/30 p-3">
                  <p className="text-xs text-[var(--muted-foreground)]">{props.labels.twoFactorHint}</p>
                  <p className="text-xs">
                    <span className="font-medium">{props.labels.twoFactorSecretLabel}: </span>
                    <span className="font-mono">{props.totpSecret}</span>
                  </p>
                  {props.totpUri ? (
                    <p className="text-xs break-all">
                      <span className="font-medium">{props.labels.twoFactorOtpAuthLabel}: </span>
                      <a className="underline" href={props.totpUri}>
                        {props.totpUri}
                      </a>
                    </p>
                  ) : null}

                  {props.totpQrDataUrl ? (
                    <div className="rounded-md border border-[var(--surface-border)] p-2">
                      <Image
                        src={props.totpQrDataUrl}
                        alt={props.labels.twoFactorTitle}
                        width={180}
                        height={180}
                        unoptimized
                        className="h-[180px] w-[180px]"
                      />
                    </div>
                  ) : null}

                  <form id="totp-enable-form" className="space-y-2" onSubmit={(event) => event.preventDefault()}>
                    <Label>{props.labels.twoFactorCodeLabel}</Label>
                    <OtpCodeField />
                    <Button type="button" onClick={props.onEnableTotp} disabled={props.isTotpPending}>
                      {props.labels.twoFactorVerifyCta}
                    </Button>
                  </form>
                </div>
              ) : null}
            </>
          ) : (
            <Button type="button" variant="destructive" onClick={props.onDisableTotp} disabled={props.isTotpPending}>
              {props.labels.twoFactorDisableCta}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>{props.labels.notificationPrefsTitle}</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">{props.labels.notificationPrefsDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
          <p className="text-sm font-medium">{props.labels.webPushTitle}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{props.labels.webPushDescription}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {props.supportsWebPush ? props.labels.webPushSupported : props.labels.webPushNotSupported}
          </p>
          {!props.supportsWebPush ? (
            <div className="rounded-md border border-[var(--surface-border)] bg-[var(--muted)]/30 p-2 text-xs text-[var(--muted-foreground)]">
              <p className="font-medium">Debug</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {props.unsupportedReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
                <li>Protocol: {props.webPushDiagnostics?.protocol ?? "n/a"}</li>
                <li>Standalone app: {props.webPushDiagnostics?.isStandalone ? "yes" : "no"}</li>
                <li>iOS device: {props.webPushDiagnostics?.isIOS ? "yes" : "no"}</li>
                <li>Permission: {props.webPushDiagnostics?.permission ?? "n/a"}</li>
                <li>VAPID public key: {props.webPushDiagnostics?.vapidConfigured ? "configured" : "missing"}</li>
              </ul>
            </div>
          ) : null}
          <p className="text-xs font-medium">
            {props.hasPushSubscription ? props.labels.webPushEnabled : props.labels.webPushDisabled}
          </p>
          <div className="inline-flex gap-2">
            <Button type="button" variant="outline" onClick={props.onEnableWebPush} disabled={props.isPushPending}>
              {props.isPushPending ? props.labels.webPushProcessing : props.labels.webPushEnableCta}
            </Button>
            <Button type="button" variant="secondary" onClick={props.onDisableWebPush} disabled={props.isPushPending}>
              {props.isPushPending ? props.labels.webPushProcessing : props.labels.webPushDisableCta}
            </Button>
            <Button type="button" onClick={props.onSendWebPushTest} disabled={props.isPushPending || !props.hasPushSubscription}>
              {props.isPushPending ? props.labels.webPushProcessing : props.labels.webPushTestCta}
            </Button>
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
          <p className="text-sm font-medium">{props.labels.notificationLocalAlwaysOnLabel}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{props.labels.notificationsRetentionDaysHint}</p>
          <div className="max-w-xs space-y-1">
            <Label htmlFor="notificationsRetentionDays">{props.labels.notificationsRetentionDaysLabel}</Label>
            <Input
              id="notificationsRetentionDays"
              type="number"
              min={1}
              max={365}
              value={String(props.notificationsRetentionDays)}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value || "1", 10);
                const next = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(365, parsed));
                props.onChangeRetentionDays(next);
              }}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={props.notifyByEmail} onChange={(event) => props.onToggleNotifyByEmail(event.target.checked)} />
            {props.labels.notificationEmailLabel}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={props.notifyByTelegram} onChange={(event) => props.onToggleNotifyByTelegram(event.target.checked)} />
            {props.labels.notificationTelegramLabel}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={props.notifyByWebPush} onChange={(event) => props.onToggleNotifyByWebPush(event.target.checked)} />
            {props.labels.notificationWebPushLabel}
          </label>
          <Button type="button" variant="outline" onClick={props.onSaveNotificationPreferences} disabled={props.isIdentityPending}>
            {props.isIdentityPending ? props.labels.webPushProcessing : props.labels.notificationPrefsSaveCta}
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>{props.labels.telegramTitle}</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">{props.labels.telegramDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-[var(--surface-border)] p-3">
          <p className="text-sm font-medium">
            {props.state.chatId ? props.labels.linkedStatus : props.labels.notLinkedStatus}
          </p>
          {props.state.chatId ? (
            <div className="mt-2 space-y-1 text-xs text-[var(--muted-foreground)]">
              <p>
                {props.labels.linkedChatIdLabel}: <span className="font-mono">{props.state.chatId}</span>
              </p>
              {props.state.username ? <p>{props.labels.linkedUsernameLabel}: @{props.state.username}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Button type="button" onClick={props.onGenerateCode} disabled={props.isPending}>
            {props.isPending ? props.labels.generating : props.labels.generateCodeCta}
          </Button>
          <p className="text-xs text-[var(--muted-foreground)]">{props.labels.expiresHint}</p>
        </div>

        {props.state.linkToken ? (
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{props.labels.codeLabel}</p>
              <p className="rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm">
                {props.state.linkToken}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">{props.labels.codeHint}</p>

              {props.linkCommand ? (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {props.labels.commandLabel}: <span className="font-mono">{props.linkCommand}</span>
                </p>
              ) : null}

              {props.state.deepLink ? (
                <Link
                  href={props.state.deepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm text-[var(--foreground)] underline underline-offset-2"
                >
                  {props.labels.openTelegramCta}
                </Link>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">{props.labels.noBotConfiguredHint}</p>
              )}
            </div>

            {props.qrImageUrl ? (
              <div className="rounded-md border border-[var(--surface-border)] p-2">
                <Image src={props.qrImageUrl} alt={props.labels.qrHint} width={180} height={180} unoptimized className="h-[180px] w-[180px]" />
                <p className="mt-2 max-w-[180px] text-center text-xs text-[var(--muted-foreground)]">{props.labels.qrHint}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ProfileSettingsManager({ locale, labels, initialIdentity, initialTelegram }: ProfileSettingsManagerProps) {
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
      vapidConfigured: Boolean(process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY),
    };
  }, []);

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

      const vapidPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
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
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{labels.subtitle}</p>
      </header>

      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} labels={labels.tabs} />

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
    </section>
  );
}




