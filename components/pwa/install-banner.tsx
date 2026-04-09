"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallBannerProps = {
  labels: {
    title: string;
    description: string;
    installCta: string;
    dismissCta: string;
  };
};

const DISMISSED_KEY = "neko.pwa.install.dismissed.v1";

export function PwaInstallBanner({ labels }: InstallBannerProps) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.localStorage.getItem(DISMISSED_KEY) === "1") return;

    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setPromptEvent(null);
  }

  function handleDismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    }
    setVisible(false);
  }

  if (!visible || !promptEvent) return null;

  return (
    <div className="mb-4 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-3">
      <p className="text-sm font-semibold">{labels.title}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{labels.description}</p>
      <div className="mt-3 inline-flex gap-2">
        <Button type="button" size="sm" onClick={handleInstall}>
          {labels.installCta}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={handleDismiss}>
          {labels.dismissCta}
        </Button>
      </div>
    </div>
  );
}

