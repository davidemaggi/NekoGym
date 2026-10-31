"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCw, Send } from "lucide-react";
import { toast } from "sonner";

import {
  retryOutboxItemAction,
  retryOutboxItemsBulkAction,
  sendManualNotificationAction,
} from "@/app/[locale]/(app)/settings/notifications/actions";
import { PageBand } from "@/components/layout/page-band";
import { SettingsSection } from "@/components/settings/settings-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTimeForApp } from "@/lib/date-time";

type NotificationsManagerProps = {
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    fields: {
      audience: string;
      subject: string;
      body: string;
    };
    audienceOptions: {
      ALL: string;
      TRAINERS: string;
      TRAINEES: string;
    };
    actions: {
      send: string;
      sending: string;
      retry: string;
      retrySelected: string;
      retrying: string;
    };
    outbox: {
      title: string;
      empty: string;
      filters: {
        status: string;
        channel: string;
        from: string;
        to: string;
        apply: string;
        reset: string;
      };
      channelOptions: {
        ALL: string;
        EMAIL: string;
        TELEGRAM: string;
        WEBPUSH: string;
      };
      statusOptions: {
        ALL: string;
        PENDING: string;
        PROCESSING: string;
        SENT: string;
        FAILED: string;
      };
      pagination: {
        prev: string;
        next: string;
        pageInfo: string;
      };
      columns: {
        channel: string;
        recipient: string;
        subject: string;
        attempts: string;
        error: string;
        createdAt: string;
        actions: string;
      };
    };
  };
  outboxFailed: Array<{
    id: string;
    channel: "EMAIL" | "TELEGRAM" | "WEBPUSH";
    status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
    subject: string | null;
    attempts: number;
    lastError: string | null;
    createdAt: string | Date;
    user: {
      name: string;
      email: string;
    };
  }>;
  filters: {
    status: "ALL" | "PENDING" | "PROCESSING" | "SENT" | "FAILED";
    channel: "ALL" | "EMAIL" | "TELEGRAM" | "WEBPUSH";
    from: string;
    to: string;
    page: number;
    totalPages: number;
    total: number;
  };
};

export function NotificationsManager({ locale, labels, outboxFailed, filters }: NotificationsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isRetryPending, startRetryTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [audience, setAudience] = useState<"ALL" | "TRAINERS" | "TRAINEES">("ALL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PROCESSING" | "SENT" | "FAILED">(filters.status);
  const [channelFilter, setChannelFilter] = useState<"ALL" | "EMAIL" | "TELEGRAM" | "WEBPUSH">(filters.channel);
  const [fromFilter, setFromFilter] = useState(filters.from);
  const [toFilter, setToFilter] = useState(filters.to);

  function statusVariant(status: "PENDING" | "PROCESSING" | "SENT" | "FAILED") {
    if (status === "FAILED") return "danger" as const;
    if (status === "SENT") return "success" as const;
    if (status === "PROCESSING") return "info" as const;
    return "warning" as const;
  }

  function pushFilters(next: { status: string; channel: string; from: string; to: string; page: number }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", next.status);
    params.set("channel", next.channel);
    if (next.from) params.set("from", next.from);
    else params.delete("from");
    if (next.to) params.set("to", next.to);
    else params.delete("to");
    params.set("page", String(next.page));
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyFilters() {
    pushFilters({ status: statusFilter, channel: channelFilter, from: fromFilter, to: toFilter, page: 1 });
  }

  function resetFilters() {
    setStatusFilter("FAILED");
    setChannelFilter("ALL");
    setFromFilter("");
    setToFilter("");
    pushFilters({ status: "FAILED", channel: "ALL", from: "", to: "", page: 1 });
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((value) => value !== id);
    });
  }

  function retrySingle(id: string) {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("id", id);

    startRetryTransition(async () => {
      const result = await retryOutboxItemAction(formData);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function retrySelected() {
    const formData = new FormData();
    formData.set("locale", locale);
    for (const id of selectedIds) {
      formData.append("ids", id);
    }

    startRetryTransition(async () => {
      const result = await retryOutboxItemsBulkAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setSelectedIds([]);
      } else {
        toast.error(result.message);
      }
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("audience", audience);
    formData.set("subject", subject);
    formData.set("body", body);

    startTransition(async () => {
      const result = await sendManualNotificationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setSubject("");
        setBody("");
      } else {
        toast.error(result.message);
      }
    });
  }

  const pageInfo = labels.outbox.pagination.pageInfo
    .replace("{page}", String(filters.page))
    .replace("{totalPages}", String(filters.totalPages))
    .replace("{total}", String(filters.total));

  return (
    <div className="space-y-5">
      <PageBand title={labels.title} description={labels.subtitle} />

      <div className="max-w-5xl">
        <SettingsSection>
          <form className="space-y-4 sm:max-w-2xl" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="notifications-audience">{labels.fields.audience}</Label>
              <select
                id="notifications-audience"
                value={audience}
                onChange={(event) => setAudience(event.target.value as "ALL" | "TRAINERS" | "TRAINEES")}
                className="ui-select w-full sm:max-w-xs"
              >
                <option value="ALL">{labels.audienceOptions.ALL}</option>
                <option value="TRAINERS">{labels.audienceOptions.TRAINERS}</option>
                <option value="TRAINEES">{labels.audienceOptions.TRAINEES}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notifications-subject">{labels.fields.subject}</Label>
              <Input id="notifications-subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notifications-body">{labels.fields.body}</Label>
              <Textarea id="notifications-body" value={body} onChange={(event) => setBody(event.target.value)} rows={6} required />
            </div>
            <Button type="submit" disabled={isPending}>
              <Send size={16} aria-hidden="true" />
              {isPending ? labels.actions.sending : labels.actions.send}
            </Button>
          </form>
        </SettingsSection>

        <SettingsSection title={labels.outbox.title} description={<span className="tabular">{pageInfo}</span>}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(4,minmax(0,1fr))_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="outbox-status">{labels.outbox.filters.status}</Label>
              <select
                id="outbox-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="ui-select w-full"
              >
                <option value="ALL">{labels.outbox.statusOptions.ALL}</option>
                <option value="PENDING">{labels.outbox.statusOptions.PENDING}</option>
                <option value="PROCESSING">{labels.outbox.statusOptions.PROCESSING}</option>
                <option value="SENT">{labels.outbox.statusOptions.SENT}</option>
                <option value="FAILED">{labels.outbox.statusOptions.FAILED}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="outbox-channel">{labels.outbox.filters.channel}</Label>
              <select
                id="outbox-channel"
                value={channelFilter}
                onChange={(event) => setChannelFilter(event.target.value as typeof channelFilter)}
                className="ui-select w-full"
              >
                <option value="ALL">{labels.outbox.channelOptions.ALL}</option>
                <option value="EMAIL">{labels.outbox.channelOptions.EMAIL}</option>
                <option value="TELEGRAM">{labels.outbox.channelOptions.TELEGRAM}</option>
                <option value="WEBPUSH">{labels.outbox.channelOptions.WEBPUSH}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="outbox-from">{labels.outbox.filters.from}</Label>
              <Input id="outbox-from" type="date" value={fromFilter} onChange={(event) => setFromFilter(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="outbox-to">{labels.outbox.filters.to}</Label>
              <Input id="outbox-to" type="date" value={toFilter} onChange={(event) => setToFilter(event.target.value)} />
            </div>
            <div className="col-span-2 flex gap-2 md:col-span-1">
              <Button type="button" variant="outline" onClick={applyFilters}>
                {labels.outbox.filters.apply}
              </Button>
              <Button type="button" variant="ghost" onClick={resetFilters}>
                {labels.outbox.filters.reset}
              </Button>
            </div>
          </div>

          {outboxFailed.length === 0 ? (
            <p className="py-4 text-[15px] text-[var(--muted-foreground)]">{labels.outbox.empty}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" disabled={isRetryPending || selectedIds.length === 0} onClick={retrySelected}>
                  <RotateCw size={16} aria-hidden="true" />
                  {isRetryPending ? labels.actions.retrying : labels.actions.retrySelected}
                  {selectedIds.length > 0 ? <span className="tabular">({selectedIds.length})</span> : null}
                </Button>
              </div>
              <ul className="border-t border-[var(--rule)]">
                {outboxFailed.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 border-b border-[var(--rule)] py-4">
                    <label className="-m-2.5 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        className="h-5 w-5"
                        aria-label={`${item.user.name} · ${item.subject ?? labels.outbox.channelOptions[item.channel]}`}
                        checked={selectedIds.includes(item.id)}
                        onChange={(event) => toggleSelect(item.id, event.target.checked)}
                      />
                    </label>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge variant={statusVariant(item.status)}>{labels.outbox.statusOptions[item.status]}</Badge>
                        <span className="text-sm font-semibold text-[var(--muted-foreground)]">
                          {labels.outbox.channelOptions[item.channel]}
                        </span>
                        <span className="tabular text-sm text-[var(--muted-foreground)]">
                          {formatDateTimeForApp(item.createdAt, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[16px] font-semibold leading-snug">{item.subject ?? "—"}</p>
                      <p className="break-words text-[15px] text-[var(--muted-foreground)]">
                        {item.user.name} · <span className="break-all">{item.user.email}</span>
                      </p>
                      {item.lastError ? (
                        <p className="break-words text-sm text-[var(--danger-fg)]">{item.lastError}</p>
                      ) : null}
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {labels.outbox.columns.attempts}: <span className="tabular">{item.attempts}</span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="shrink-0"
                      disabled={isRetryPending}
                      onClick={() => retrySingle(item.id)}
                    >
                      <RotateCw size={16} aria-hidden="true" />
                      <span className="hidden sm:inline">{isRetryPending ? labels.actions.retrying : labels.actions.retry}</span>
                      <span className="sr-only sm:hidden">{labels.actions.retry}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {filters.totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={filters.page <= 1}
                onClick={() => pushFilters({ status: statusFilter, channel: channelFilter, from: fromFilter, to: toFilter, page: filters.page - 1 })}
              >
                {labels.outbox.pagination.prev}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={filters.page >= filters.totalPages}
                onClick={() => pushFilters({ status: statusFilter, channel: channelFilter, from: fromFilter, to: toFilter, page: filters.page + 1 })}
              >
                {labels.outbox.pagination.next}
              </Button>
            </div>
          ) : null}
        </SettingsSection>
      </div>
    </div>
  );
}
