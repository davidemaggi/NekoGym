"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import {
  changePasswordAction,
  requestEmailChangeAction,
  sendTestWebPushAction,
  startTelegramLinkAction,
  updateNotificationPreferencesAction,
} from "@/app/[locale]/(app)/settings/profile/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileSettingsManagerProps = {
  locale: string;
  labels: {
    title: string;
    subtitle: string;
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
  };
  initialIdentity: {
    email: string;
    pendingEmail: string | null;
    isEmailVerified: boolean;
    hasWebPushSubscription: boolean;
    notifyByEmail: boolean;
    notifyByTelegram: boolean;
    notifyByWebPush: boolean;
  };
  initialTelegram: {
    chatId: string | null;
    username: string | null;
    linkToken: string | null;
    deepLink: string | null;
  };
};

export function ProfileSettingsManager({ locale, labels, initialIdentity, initialTelegram }: ProfileSettingsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isIdentityPending, startIdentityTransition] = useTransition();
  const [state, setState] = useState(initialTelegram);
  const [qrVersion, setQrVersion] = useState(0);
  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState(initialIdentity.pendingEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPushPending, startPushTransition] = useTransition();
  const [hasPushSubscription, setHasPushSubscription] = useState(initialIdentity.hasWebPushSubscription);
  const [notifyByEmail, setNotifyByEmail] = useState(initialIdentity.notifyByEmail);
  const [notifyByTelegram, setNotifyByTelegram] = useState(initialIdentity.notifyByTelegram);
  const [notifyByWebPush, setNotifyByWebPush] = useState(initialIdentity.notifyByWebPush);
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

      <Card>
        <CardHeader>
          <CardTitle>{labels.accountSecurityTitle}</CardTitle>
          <p className="text-sm text-[var(--muted-foreground)]">{labels.accountSecurityDescription}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-[var(--surface-border)] p-3">
            <p className="text-sm font-medium">
              {labels.currentEmailLabel}: {initialIdentity.email}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {initialIdentity.isEmailVerified
                ? labels.emailVerifiedStatus
                : labels.emailNotVerifiedStatus}
            </p>
            {pendingEmail ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {labels.pendingEmailLabel}: {pendingEmail}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
            <Label htmlFor="newEmail">{labels.newEmailLabel}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder={labels.newEmailPlaceholder}
              />
              <Button type="button" variant="outline" onClick={handleRequestEmailChange} disabled={isIdentityPending || !newEmail}>
                {labels.sendEmailChangeCta}
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
            <Label htmlFor="currentPassword">{labels.currentPasswordLabel}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <Label htmlFor="newPassword">{labels.newPasswordLabel}</Label>
            <Input
              id="newPassword"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Button type="button" onClick={handleChangePassword} disabled={isIdentityPending || !currentPassword || newPassword.length < 8}>
              {labels.updatePasswordCta}
            </Button>
          </div>

          <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
            <p className="text-sm font-medium">{labels.webPushTitle}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{labels.webPushDescription}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {supportsWebPush
                ? labels.webPushSupported
                : labels.webPushNotSupported}
            </p>
            {!supportsWebPush ? (
              <div className="rounded-md border border-[var(--surface-border)] bg-[var(--muted)]/30 p-2 text-xs text-[var(--muted-foreground)]">
                <p className="font-medium">Debug</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {unsupportedReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                  <li>Protocol: {webPushDiagnostics?.protocol ?? "n/a"}</li>
                  <li>Standalone app: {webPushDiagnostics?.isStandalone ? "yes" : "no"}</li>
                  <li>iOS device: {webPushDiagnostics?.isIOS ? "yes" : "no"}</li>
                  <li>Permission: {webPushDiagnostics?.permission ?? "n/a"}</li>
                  <li>VAPID public key: {webPushDiagnostics?.vapidConfigured ? "configured" : "missing"}</li>
                </ul>
              </div>
            ) : null}
            <p className="text-xs font-medium">
              {hasPushSubscription ? labels.webPushEnabled : labels.webPushDisabled}
            </p>
            <div className="inline-flex gap-2">
              <Button type="button" variant="outline" onClick={handleEnableWebPush} disabled={isPushPending}>
                {isPushPending ? labels.webPushProcessing : labels.webPushEnableCta}
              </Button>
              <Button type="button" variant="secondary" onClick={handleDisableWebPush} disabled={isPushPending}>
                {isPushPending ? labels.webPushProcessing : labels.webPushDisableCta}
              </Button>
              <Button type="button" onClick={handleSendWebPushTest} disabled={isPushPending || !hasPushSubscription}>
                {isPushPending ? labels.webPushProcessing : labels.webPushTestCta}
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-3">
            <p className="text-sm font-medium">{labels.notificationPrefsTitle}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{labels.notificationPrefsDescription}</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notifyByEmail} onChange={(event) => setNotifyByEmail(event.target.checked)} />
              {labels.notificationEmailLabel}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notifyByTelegram} onChange={(event) => setNotifyByTelegram(event.target.checked)} />
              {labels.notificationTelegramLabel}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notifyByWebPush} onChange={(event) => setNotifyByWebPush(event.target.checked)} />
              {labels.notificationWebPushLabel}
            </label>
            <Button type="button" variant="outline" onClick={handleSaveNotificationPreferences} disabled={isIdentityPending}>
              {isIdentityPending ? labels.webPushProcessing : labels.notificationPrefsSaveCta}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.telegramTitle}</CardTitle>
          <p className="text-sm text-[var(--muted-foreground)]">{labels.telegramDescription}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-[var(--surface-border)] p-3">
            <p className="text-sm font-medium">
              {state.chatId ? labels.linkedStatus : labels.notLinkedStatus}
            </p>
            {state.chatId ? (
              <div className="mt-2 space-y-1 text-xs text-[var(--muted-foreground)]">
                <p>
                  {labels.linkedChatIdLabel}: <span className="font-mono">{state.chatId}</span>
                </p>
                {state.username ? <p>{labels.linkedUsernameLabel}: @{state.username}</p> : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Button type="button" onClick={handleGenerateCode} disabled={isPending}>
              {isPending ? labels.generating : labels.generateCodeCta}
            </Button>
            <p className="text-xs text-[var(--muted-foreground)]">{labels.expiresHint}</p>
          </div>

          {state.linkToken ? (
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{labels.codeLabel}</p>
                <p className="rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-2 font-mono text-sm">
                  {state.linkToken}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">{labels.codeHint}</p>

                {linkCommand ? (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {labels.commandLabel}: <span className="font-mono">{linkCommand}</span>
                  </p>
                ) : null}

                {state.deepLink ? (
                  <Link
                    href={state.deepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm text-[var(--foreground)] underline underline-offset-2"
                  >
                    {labels.openTelegramCta}
                  </Link>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400">{labels.noBotConfiguredHint}</p>
                )}
              </div>

              {qrImageUrl ? (
                <div className="rounded-md border border-[var(--surface-border)] p-2">
                  <Image src={qrImageUrl} alt={labels.qrHint} width={180} height={180} unoptimized className="h-[180px] w-[180px]" />
                  <p className="mt-2 max-w-[180px] text-center text-xs text-[var(--muted-foreground)]">{labels.qrHint}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}





