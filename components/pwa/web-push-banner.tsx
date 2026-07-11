"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type WebPushBannerProps = {
  publicKey: string;
  labels: {
    title: string;
    description: string;
    enableCta: string;
    dismissCta: string;
    unsupported: string;
    enabled: string;
  };
};

const DISMISSED_KEY = "neko.webpush.prompt.dismissed.v1";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

function isIOSStandaloneRequired() {
  const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIOS && !isStandalone;
}

function supportsWebPush() {
  return (
    window.isSecureContext &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    !isIOSStandaloneRequired()
  );
}

export function WebPushPromptBanner({ publicKey, labels }: WebPushBannerProps) {
  const [visible, setVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!publicKey || typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISSED_KEY) === "1") return;
    if (!supportsWebPush()) return;
    if (Notification.permission === "denied") return;

    let cancelled = false;

    async function checkExistingSubscription() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled && !existing) {
          setVisible(true);
        }
      } catch {
        // Unsupported or blocked service worker contexts should not show a prompt.
      }
    }

    void checkExistingSubscription();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  function handleDismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  function handleEnable() {
    startTransition(async () => {
      if (!supportsWebPush()) {
        toast.error(labels.unsupported);
        setVisible(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        handleDismiss();
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
        });

        const response = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        if (!response.ok) {
          throw new Error(`subscribe failed (${response.status})`);
        }

        setVisible(false);
        toast.success(labels.enabled);
      } catch (error) {
        const message = error instanceof Error ? error.message : labels.unsupported;
        toast.error(message);
      }
    });
  }

  if (!visible) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--muted)] text-[var(--foreground)]">
          <Bell size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{labels.title}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{labels.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" onClick={handleEnable} disabled={isPending}>
          {labels.enableCta}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={handleDismiss} disabled={isPending}>
          {labels.dismissCta}
        </Button>
      </div>
    </div>
  );
}
