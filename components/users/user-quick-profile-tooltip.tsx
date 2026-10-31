"use client";

import { type ReactNode, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";

import { getAppDateTimeConfig } from "@/lib/date-time";
import { cn } from "@/lib/utils";

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
  const none = locale === "it" ? "Nessuna" : "None";
  if (!value) return none;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return none;
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: getAppDateTimeConfig().timeZone,
  }).format(date);
}

function membershipDurationLabel(createdAt: string, locale: string): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "-";

  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
  const it = locale === "it";
  const unit = (n: number, one: [string, string], many: [string, string]) => `${n} ${n === 1 ? one[it ? 0 : 1] : many[it ? 0 : 1]}`;
  if (diffDays === 0) return "";
  if (diffDays < 30) return unit(diffDays, ["giorno", "day"], ["giorni", "days"]);
  if (diffDays < 365) return unit(Math.floor(diffDays / 30), ["mese", "month"], ["mesi", "months"]);
  return unit(Math.floor(diffDays / 365), ["anno", "year"], ["anni", "years"]);
}

export function UserQuickProfileTooltip({ userId, locale, className, children }: UserQuickProfileTooltipProps) {
  const t = useMemo(() => labelsForLocale(locale), [locale]);
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

  const countList = (title: string, entries: Array<{ type: string; count: number }>, prefix: string) => (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      {entries.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">{t.empty}</p>
      ) : (
        <dl className="mt-1 space-y-0.5 text-sm">
          {entries.map((entry) => (
            <div key={`${prefix}-${entry.type}`} className="flex justify-between gap-3">
              <dt className="text-[var(--muted-foreground)]">{entry.type}</dt>
              <dd className="tabular font-semibold">{entry.count}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );

  // A popover, not a hover tooltip: it opens on tap, click or keyboard, so phones get it too.
  return (
    <Popover.Root onOpenChange={(next) => next && void ensureLoaded()}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-11 max-w-full items-center text-left underline decoration-[var(--muted-foreground)] decoration-dotted underline-offset-4 hover:decoration-solid",
            className
          )}
        >
          <span className="truncate">{children}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-[60] w-[min(20rem,calc(100vw-24px))] rounded-2xl border border-[var(--rule)] bg-[var(--surface)] p-4 text-left text-[15px] shadow-[var(--shadow-sheet)] outline-none"
        >
          {loading ? (
            <p className="text-[var(--muted-foreground)]">{t.loading}</p>
          ) : error ? (
            <p className="font-semibold text-[var(--danger-fg)]">{error}</p>
          ) : data ? (
            <div className="space-y-3">
              <div>
                <p className="text-[17px] font-semibold leading-tight">{data.user.name}</p>
                <p className="break-all text-sm text-[var(--muted-foreground)]">{data.user.email}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {t.memberSince} <span className="tabular">{formatDate(data.user.createdAt, locale)}</span>
                  {membershipDurationLabel(data.user.createdAt, locale) ? ` · ${membershipDurationLabel(data.user.createdAt, locale)}` : ""}
                </p>
              </div>
              <div className="grid gap-3 border-t border-[var(--rule)] pt-3">
                {countList(t.completedByType, data.stats.completedByType, `done-${data.user.id}`)}
                {countList(t.futureByType, data.stats.futureByType, `future-${data.user.id}`)}
              </div>
              <dl className="space-y-0.5 border-t border-[var(--rule)] pt-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">{t.firstLesson}</dt>
                  <dd className="tabular">{formatDate(data.stats.firstCompletedLessonAt, locale)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted-foreground)]">{t.lastLesson}</dt>
                  <dd className="tabular">{formatDate(data.stats.lastCompletedLessonAt, locale)}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
