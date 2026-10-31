"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

const UnreadCountContext = createContext(0);

type LocalNotificationsLiveProviderProps = {
  children: ReactNode;
  pollMs?: number;
};

/** Polls the local inbox once for the whole shell; badges read the count from context. */
export function LocalNotificationsLiveProvider({ children, pollMs = 5000 }: LocalNotificationsLiveProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const sinceRef = useRef(new Date().toISOString());
  const seenIdsRef = useRef(new Set<string>());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/local-notifications/summary?since=${encodeURIComponent(sinceRef.current)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          unreadCount: number;
          now: string;
          newItems: Array<{ id: string; subject: string | null; body: string }>;
        };
        setUnreadCount(data.unreadCount);
        sinceRef.current = data.now;

        for (const item of data.newItems) {
          if (seenIdsRef.current.has(item.id)) continue;
          seenIdsRef.current.add(item.id);
          toast.message(item.subject ?? "Notification", {
            description: item.body,
          });
        }
      } catch {
        // Ignore transient fetch errors.
      }
    };

    void poll();
    timer = setInterval(() => {
      if (stopped) return;
      void poll();
    }, pollMs);

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [pollMs]);

  return <UnreadCountContext.Provider value={unreadCount}>{children}</UnreadCountContext.Provider>;
}

export function useUnreadNotificationsCount() {
  return useContext(UnreadCountContext);
}

/** Count bubble; the visible number is paired with a screen-reader phrase. */
export function LocalNotificationsBadge({ srLabel, className = "" }: { srLabel: string; className?: string }) {
  const unreadCount = useUnreadNotificationsCount();
  if (unreadCount <= 0) return null;

  return (
    <span
      className={`tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--destructive-bg)] px-1.5 text-[11px] font-bold leading-none text-[var(--destructive-fg)] ${className}`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
      <span className="sr-only"> {srLabel}</span>
    </span>
  );
}
