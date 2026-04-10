"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  retryOutboxItemAction,
  retryOutboxItemsBulkAction,
  sendManualNotificationAction,
} from "@/app/[locale]/(app)/settings/notifications/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  function channelVariant(channel: "EMAIL" | "TELEGRAM" | "WEBPUSH") {
    if (channel === "EMAIL") return "info" as const;
    if (channel === "TELEGRAM") return "success" as const;
    return "warning" as const;
  }

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

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight">{labels.title}</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{labels.subtitle}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{labels.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="notifications-audience">{labels.fields.audience}</Label>
              <select
                id="notifications-audience"
                value={audience}
                onChange={(event) => setAudience(event.target.value as "ALL" | "TRAINERS" | "TRAINEES")}
                className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
              >
                <option value="ALL">{labels.audienceOptions.ALL}</option>
                <option value="TRAINERS">{labels.audienceOptions.TRAINERS}</option>
                <option value="TRAINEES">{labels.audienceOptions.TRAINEES}</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notifications-subject">{labels.fields.subject}</Label>
              <Input id="notifications-subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notifications-body">{labels.fields.body}</Label>
              <Textarea id="notifications-body" value={body} onChange={(event) => setBody(event.target.value)} rows={6} required />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? labels.actions.sending : labels.actions.send}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.outbox.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-6">
            <div className="space-y-1">
              <Label htmlFor="outbox-status">{labels.outbox.filters.status}</Label>
              <select
                id="outbox-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="h-9 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-2 text-xs"
              >
                <option value="ALL">{labels.outbox.statusOptions.ALL}</option>
                <option value="PENDING">{labels.outbox.statusOptions.PENDING}</option>
                <option value="PROCESSING">{labels.outbox.statusOptions.PROCESSING}</option>
                <option value="SENT">{labels.outbox.statusOptions.SENT}</option>
                <option value="FAILED">{labels.outbox.statusOptions.FAILED}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="outbox-channel">{labels.outbox.filters.channel}</Label>
              <select
                id="outbox-channel"
                value={channelFilter}
                onChange={(event) => setChannelFilter(event.target.value as typeof channelFilter)}
                className="h-9 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-2 text-xs"
              >
                <option value="ALL">{labels.outbox.channelOptions.ALL}</option>
                <option value="EMAIL">{labels.outbox.channelOptions.EMAIL}</option>
                <option value="TELEGRAM">{labels.outbox.channelOptions.TELEGRAM}</option>
                <option value="WEBPUSH">{labels.outbox.channelOptions.WEBPUSH}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="outbox-from">{labels.outbox.filters.from}</Label>
              <Input id="outbox-from" type="date" value={fromFilter} onChange={(event) => setFromFilter(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="outbox-to">{labels.outbox.filters.to}</Label>
              <Input id="outbox-to" type="date" value={toFilter} onChange={(event) => setToFilter(event.target.value)} />
            </div>
            <div className="inline-flex items-end gap-2 md:col-span-2">
              <Button type="button" variant="outline" onClick={applyFilters}>
                {labels.outbox.filters.apply}
              </Button>
              <Button type="button" variant="secondary" onClick={resetFilters}>
                {labels.outbox.filters.reset}
              </Button>
            </div>
          </div>

          <Button type="button" variant="outline" disabled={isRetryPending || selectedIds.length === 0} onClick={retrySelected}>
            {isRetryPending ? labels.actions.retrying : labels.actions.retrySelected}
          </Button>

          <p className="text-xs text-[var(--muted-foreground)]">
            {labels.outbox.pagination.pageInfo
              .replace("{page}", String(filters.page))
              .replace("{totalPages}", String(filters.totalPages))
              .replace("{total}", String(filters.total))}
          </p>

          {outboxFailed.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">{labels.outbox.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--surface-border)] text-left">
                    <th className="py-2 pr-2" />
                    <th className="py-2 pr-2">{labels.outbox.columns.channel}</th>
                    <th className="py-2 pr-2">{labels.outbox.filters.status}</th>
                    <th className="py-2 pr-2">{labels.outbox.columns.recipient}</th>
                    <th className="py-2 pr-2">{labels.outbox.columns.subject}</th>
                    <th className="py-2 pr-2">{labels.outbox.columns.attempts}</th>
                    <th className="py-2 pr-2">{labels.outbox.columns.error}</th>
                    <th className="py-2 pr-2">{labels.outbox.columns.createdAt}</th>
                    <th className="py-2 text-right">{labels.outbox.columns.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {outboxFailed.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--surface-border)]/70">
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={(event) => toggleSelect(item.id, event.target.checked)}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Badge variant={channelVariant(item.channel)}>
                          {labels.outbox.channelOptions[item.channel]}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2">
                        <Badge variant={statusVariant(item.status)}>{labels.outbox.statusOptions[item.status]}</Badge>
                      </td>
                      <td className="py-2 pr-2">{item.user.name} ({item.user.email})</td>
                      <td className="py-2 pr-2">{item.subject ?? "-"}</td>
                      <td className="py-2 pr-2">{item.attempts}</td>
                      <td className="py-2 pr-2">{item.lastError ?? "-"}</td>
                      <td className="py-2 pr-2">{formatDateTimeForApp(item.createdAt)}</td>
                      <td className="py-2 text-right">
                        <Button type="button" size="sm" variant="outline" disabled={isRetryPending} onClick={() => retrySingle(item.id)}>
                          {isRetryPending ? labels.actions.retrying : labels.actions.retry}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="inline-flex items-center gap-2">
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
        </CardContent>
      </Card>
    </section>
  );
}
