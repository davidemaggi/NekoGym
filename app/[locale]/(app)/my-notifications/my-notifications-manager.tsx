"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { deleteAllLocalNotificationsAction, deleteLocalNotificationAction } from "@/app/[locale]/(app)/my-notifications/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { formatDateTimeForApp } from "@/lib/date-time";

type NotificationItem = {
  id: string;
  subject: string | null;
  body: string;
  createdAt: string;
  isNew: boolean;
};

type MyNotificationsManagerProps = {
  locale: string;
  labels: {
    title: string;
    description: string;
    empty: string;
    deleteOneCta: string;
    deleteAllCta: string;
    confirmDeleteAllTitle: string;
    confirmDeleteAllDescription: string;
    confirmDeleteAllConfirmCta: string;
    confirmDeleteAllCancelCta: string;
    pageLabel: string;
    unreadBadge: string;
    unreadOne: string;
    unreadMany: string;
    prevPage: string;
    nextPage: string;
  };
  items: NotificationItem[];
  page: number;
  totalPages: number;
};

export function MyNotificationsManager({ locale, labels, items, page, totalPages }: MyNotificationsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [liveItems, setLiveItems] = useState<NotificationItem[]>(items);
  const seenIdsRef = useRef(new Set(items.map((item) => item.id)));
  const startedAtRef = useRef(new Date().toISOString());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const poll = async () => {
      try {
        const response = await fetch(`/api/local-notifications/summary?since=${encodeURIComponent(startedAtRef.current)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          now: string;
          newItems: Array<{ id: string; subject: string | null; body: string; createdAt: string }>;
        };
        startedAtRef.current = data.now;
        const fresh = data.newItems.filter((item) => !seenIdsRef.current.has(item.id));
        if (fresh.length === 0) return;
        for (const item of fresh) {
          seenIdsRef.current.add(item.id);
        }
        setLiveItems((prev) => [
          ...fresh
            .map((item) => ({ ...item, isNew: true }))
            .filter((item) => !prev.some((existing) => existing.id === item.id)),
          ...prev,
        ]);
      } catch {
        // Ignore transient polling errors.
      }
    };

    timer = setInterval(() => {
      void poll();
    }, 5000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  function deleteOne(id: string) {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("id", id);

    startTransition(async () => {
      const result = await deleteLocalNotificationAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setLiveItems((prev) => prev.filter((item) => item.id !== id));
      router.refresh();
    });
  }

  function deleteAll() {
    const formData = new FormData();
    formData.set("locale", locale);

    startTransition(async () => {
      const result = await deleteAllLocalNotificationsAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setLiveItems([]);
      setConfirmDeleteAll(false);
      router.refresh();
    });
  }

  const sortedItems = useMemo(
    () => [...liveItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [liveItems]
  );

  const unreadCount = sortedItems.filter((item) => item.isNew).length;

  return (
    <div>
      <div
        data-page-band
        className="-mt-4 bg-[var(--stock)] pb-5 pt-1 shadow-[0_0_0_100vmax_var(--stock)] [clip-path:inset(0_-100vmax)] lg:-mt-10 lg:pb-6 lg:pt-10"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.375rem] font-bold leading-tight lg:text-[2rem]">{labels.title}</h1>
            <p className="mt-1 text-[15px] text-[var(--stock-ink)]/75">
              {unreadCount > 0 ? (
                <>
                  {unreadCount === 1 ? labels.unreadOne : <>{labels.unreadMany.split("{n}")[0]}<span className="tabular">{unreadCount}</span>{labels.unreadMany.split("{n}")[1]}</>} · {labels.description}
                </>
              ) : (
                labels.description
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmDeleteAll(true)}
            disabled={isPending || sortedItems.length === 0}
            className="text-[var(--danger-fg)] hover:bg-[var(--danger-bg)]"
          >
            <Trash2 size={18} aria-hidden="true" />
            <span className="hidden sm:inline">{labels.deleteAllCta}</span>
            <span className="sr-only sm:hidden">{labels.deleteAllCta}</span>
          </Button>
        </header>
      </div>

      {sortedItems.length === 0 ? (
        <p className="pt-6 text-[15px] text-[var(--muted-foreground)]">{labels.empty}</p>
      ) : (
        <ul className="-mx-4 max-w-3xl pt-2 sm:mx-0">
          {sortedItems.map((item) => (
            <li
              key={item.id}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-b border-[var(--rule)] px-4 py-4 last:border-b-0",
                // Unread notifications are picked up off the paper.
                item.isNew ? "my-1 border-b-0 bg-[var(--surface)] shadow-[var(--shadow-lift)] sm:rounded-2xl" : "sm:px-0"
              )}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[17px] font-semibold leading-snug">
                  {item.isNew ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--foreground)]">
                      <span className="sr-only">{labels.unreadBadge}</span>
                    </span>
                  ) : null}
                  <span className="min-w-0 break-words">{item.subject ?? "-"}</span>
                </p>
                <p className="tabular mt-0.5 text-sm text-[var(--muted-foreground)]">
                  {formatDateTimeForApp(item.createdAt, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="mt-2 max-w-[65ch] whitespace-pre-wrap text-[15px] [overflow-wrap:anywhere]">{item.body}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteOne(item.id)}
                disabled={isPending}
                aria-label={`${labels.deleteOneCta}: ${item.subject ?? ""}`}
                className="inline-flex h-11 w-11 items-center justify-center self-start rounded-xl text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
      <div className="pt-6">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              label={labels.prevPage}
              disabled={page <= 1}
              onClick={() => router.push(`/${locale}/my-notifications?page=${Math.max(1, page - 1)}`)}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="tabular px-3 text-[15px] text-[var(--muted-foreground)]">
              {labels.pageLabel.replace("{page}", String(page)).replace("{totalPages}", String(totalPages))}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              label={labels.nextPage}
              disabled={page >= totalPages}
              onClick={() => router.push(`/${locale}/my-notifications?page=${Math.min(totalPages, page + 1)}`)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      </div>
      ) : null}

      <AlertDialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.confirmDeleteAllTitle}</AlertDialogTitle>
            <AlertDialogDescription>{labels.confirmDeleteAllDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">{labels.confirmDeleteAllCancelCta}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={deleteAll} disabled={isPending}>
                {labels.confirmDeleteAllConfirmCta}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
