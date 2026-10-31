"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, X } from "lucide-react";
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
    // Phones: a one-line strip docked above the tab bar. Larger screens: a small card bottom-right.
    <div
      role="region"
      aria-label={labels.title}
      className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] py-2 pl-4 pr-2 shadow-[var(--shadow-sheet)] sm:inset-x-auto sm:right-6 sm:block sm:w-[24rem] sm:p-4 lg:bottom-6"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:items-start">
        <span aria-hidden="true" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--stock-giallino)] text-[var(--stock-ink)] sm:inline-flex">
          <Bell size={18} />
        </span>
        <Bell size={18} aria-hidden="true" className="shrink-0 sm:hidden" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-snug">{labels.title}</p>
          <p className="mt-0.5 hidden text-sm text-[var(--muted-foreground)] sm:block">{labels.description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:mt-3 sm:gap-2">
        <Button type="button" size="sm" className="h-11 px-4 sm:flex-1" onClick={handleEnable} disabled={isPending}>
          {labels.enableCta}
        </Button>
        <Button type="button" variant="ghost" className="hidden sm:inline-flex sm:flex-1" onClick={handleDismiss} disabled={isPending}>
          {labels.dismissCta}
        </Button>
        <Button type="button" variant="ghost" size="icon" className="sm:hidden" onClick={handleDismiss} disabled={isPending} aria-label={labels.dismissCta}>
          <X size={18} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
