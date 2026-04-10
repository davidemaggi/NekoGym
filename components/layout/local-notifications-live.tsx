"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type LocalNotificationsLiveProps = {
  pollMs?: number;
};

export function LocalNotificationsLive({ pollMs = 5000 }: LocalNotificationsLiveProps) {
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

  if (unreadCount <= 0) return null;

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-5 text-white">
      {unreadCount}
    </span>
  );
}
