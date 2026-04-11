"use client";

import { type ReactNode, useMemo, useState } from "react";

type QuickProfileResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  stats: {
    completedByType: Array<{ type: string; count: number }>;
    futureByType: Array<{ type: string; count: number }>;
    firstCompletedLessonAt: string | null;
    lastCompletedLessonAt: string | null;
  };
};

type UserQuickProfileTooltipProps = {
  userId: string;
  locale: string;
  className?: string;
  children: ReactNode;
};

const profileCache = new Map<string, Promise<QuickProfileResponse>>();

function labelsForLocale(locale: string) {
  const isIt = locale === "it";
  return {
    loading: isIt ? "Caricamento..." : "Loading...",
    loadError: isIt ? "Impossibile caricare i dettagli utente." : "Unable to load user details.",
    memberSince: isIt ? "Iscritto da" : "Member since",
    completedByType: isIt ? "Lezioni completate per tipo" : "Completed lessons by type",
    futureByType: isIt ? "Iscrizioni future per tipo" : "Future bookings by type",
    firstLesson: isIt ? "Prima lezione completata" : "First completed lesson",
    lastLesson: isIt ? "Ultima lezione completata" : "Last completed lesson",
    empty: "-",
  };
}

function loadQuickProfile(userId: string): Promise<QuickProfileResponse> {
  const existing = profileCache.get(userId);
  if (existing) return existing;

  const request = fetch(`/api/users/${encodeURIComponent(userId)}/quick-profile`, {
    method: "GET",
    cache: "no-store",
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to load user quick profile (${response.status})`);
    }
    return response.json() as Promise<QuickProfileResponse>;
  });

  profileCache.set(userId, request);
  return request;
}

function formatDate(value: string | null, locale: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function membershipDurationLabel(createdAt: string, locale: string): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "-";

  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
  if (locale === "it") {
    if (diffDays < 30) return `${diffDays} giorni`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mesi`;
    return `${Math.floor(diffDays / 365)} anni`;
  }
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
}

export function UserQuickProfileTooltip({ userId, locale, className, children }: UserQuickProfileTooltipProps) {
  const t = useMemo(() => labelsForLocale(locale), [locale]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QuickProfileResponse | null>(null);

  async function ensureLoaded() {
    if (loading || data) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loadQuickProfile(userId);
      setData(result);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }

  function openTooltip() {
    setOpen(true);
    void ensureLoaded();
  }

  return (
    <span
      className={`relative inline-flex max-w-full ${className ?? ""}`}
      onMouseEnter={openTooltip}
      onMouseLeave={() => setOpen(false)}
      onFocus={openTooltip}
      onBlur={() => setOpen(false)}
    >
      <span className="truncate cursor-help decoration-dotted underline-offset-2 hover:underline">{children}</span>
      {open ? (
        <span className="pointer-events-none absolute left-0 top-full z-50 mt-1 w-80 rounded-md border border-[var(--surface-border)] bg-[var(--surface)] p-3 text-left text-xs shadow-lg">
          {loading ? (
            <span className="text-[var(--muted-foreground)]">{t.loading}</span>
          ) : error ? (
            <span className="text-[var(--danger-fg)]">{error}</span>
          ) : data ? (
            <span className="space-y-2">
              <span className="block text-base font-semibold leading-tight">{data.user.name}</span>
              <span className="block text-[var(--muted-foreground)]">{data.user.email}</span>
              <span className="block text-[var(--muted-foreground)]">
                {t.memberSince}: {formatDate(data.user.createdAt, locale)} ({membershipDurationLabel(data.user.createdAt, locale)})
              </span>

              <span className="mt-2 block border-t border-[var(--surface-border)] pt-2">
                <span className="block font-medium">{t.completedByType}</span>
                {data.stats.completedByType.length === 0 ? (
                  <span className="block text-[var(--muted-foreground)]">{t.empty}</span>
                ) : (
                  data.stats.completedByType.map((entry) => (
                    <span key={`done-${data.user.id}-${entry.type}`} className="block text-[var(--muted-foreground)]">
                      {entry.type}: {entry.count}
                    </span>
                  ))
                )}
              </span>

              <span className="block">
                <span className="block font-medium">{t.futureByType}</span>
                {data.stats.futureByType.length === 0 ? (
                  <span className="block text-[var(--muted-foreground)]">{t.empty}</span>
                ) : (
                  data.stats.futureByType.map((entry) => (
                    <span key={`future-${data.user.id}-${entry.type}`} className="block text-[var(--muted-foreground)]">
                      {entry.type}: {entry.count}
                    </span>
                  ))
                )}
              </span>

              <span className="block border-t border-[var(--surface-border)] pt-2 text-[var(--muted-foreground)]">
                {t.firstLesson}: {formatDate(data.stats.firstCompletedLessonAt, locale)}
              </span>
              <span className="block text-[var(--muted-foreground)]">
                {t.lastLesson}: {formatDate(data.stats.lastCompletedLessonAt, locale)}
              </span>
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
