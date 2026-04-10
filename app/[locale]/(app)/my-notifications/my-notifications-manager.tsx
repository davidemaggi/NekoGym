"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deleteAllLocalNotificationsAction, deleteLocalNotificationAction } from "@/app/[locale]/(app)/my-notifications/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{labels.description}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setConfirmDeleteAll(true)} disabled={isPending || sortedItems.length === 0}>
          <Trash2 className="h-4 w-4" />
          <span>{labels.deleteAllCta}</span>
        </Button>
      </header>

      {sortedItems.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">{labels.empty}</p>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className={[
                "rounded-md border p-3",
                item.isNew ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/20" : "border-[var(--surface-border)]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{item.subject ?? "-"}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{formatDateTimeForApp(item.createdAt)}</p>
                  {item.isNew ? <Badge variant="success" className="mt-1">{labels.unreadBadge}</Badge> : null}
                </div>
                <Button type="button" size="sm" variant="destructive" onClick={() => deleteOne(item.id)} disabled={isPending}>
                  {labels.deleteOneCta}
                </Button>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{item.body}</p>
            </div>
          ))}
        </div>
      )}

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={page <= 1}
              onClick={() => router.push(`/${locale}/my-notifications?page=${Math.max(1, page - 1)}`)}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="px-2 text-sm text-[var(--muted-foreground)]">
              {labels.pageLabel.replace("{page}", String(page)).replace("{totalPages}", String(totalPages))}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              disabled={page >= totalPages}
              onClick={() => router.push(`/${locale}/my-notifications?page=${Math.min(totalPages, page + 1)}`)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <AlertDialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.confirmDeleteAllTitle}</AlertDialogTitle>
            <AlertDialogDescription>{labels.confirmDeleteAllDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary">{labels.confirmDeleteAllCancelCta}</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={deleteAll} disabled={isPending}>
                {labels.confirmDeleteAllConfirmCta}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
