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
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[15px] font-semibold">{labels.title}</p>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{labels.description}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" onClick={handleInstall}>
          {labels.installCta}
        </Button>
        <Button type="button" variant="ghost" onClick={handleDismiss}>
          {labels.dismissCta}
        </Button>
      </div>
    </div>
  );
}

