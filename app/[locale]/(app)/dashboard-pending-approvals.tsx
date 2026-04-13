"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ListChecks, ThumbsDown, ThumbsUp } from "lucide-react";

import { confirmLessonBookingAction, rejectLessonBookingAction } from "@/app/[locale]/(app)/bookings/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserQuickProfileTooltip } from "@/components/users/user-quick-profile-tooltip";

type PendingApprovalItem = {
  lessonId: string;
  traineeId: string;
  traineeName: string;
  lessonTitle: string;
  lessonTypeName: string;
  startsAtLabel: string;
};

type DashboardPendingApprovalsProps = {
  locale: string;
  count: number;
  items: PendingApprovalItem[];
  canGrantOpenAccess: boolean;
  labels: {
    statLabel: string;
    openCta: string;
    dialogTitle: string;
    dialogDescription: string;
    empty: string;
    approveCta: string;
    approveAndUnlockCta: string;
    rejectCta: string;
    closeCta: string;
  };
};

export function DashboardPendingApprovals({
  locale,
  count,
  items,
  canGrantOpenAccess,
  labels,
}: DashboardPendingApprovalsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const hasItems = useMemo(() => items.length > 0, [items.length]);

  function act(input: {
    lessonId: string;
    traineeId: string;
    kind: "approve" | "approveUnlock" | "reject";
  }) {
    const key = `${input.lessonId}:${input.traineeId}:${input.kind}`;
    setBusyKey(key);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("locale", locale);
      formData.set("lessonId", input.lessonId);
      formData.set("traineeId", input.traineeId);
      if (input.kind === "approveUnlock") formData.set("grantOpenAccess", "1");

      const result = input.kind === "reject"
        ? await rejectLessonBookingAction(formData)
        : await confirmLessonBookingAction(formData);

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
      setBusyKey(null);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] p-4">
        <p className="text-sm text-[var(--muted-foreground)]">{labels.statLabel}</p>
        <p className="mt-2 text-2xl font-semibold">{count}</p>
        <DialogTrigger asChild>
          <Button className="mt-3" variant="outline" size="sm">
            {labels.openCta}
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{labels.dialogTitle}</DialogTitle>
          <DialogDescription>{labels.dialogDescription}</DialogDescription>
        </DialogHeader>

        {!hasItems ? (
          <p className="text-sm text-[var(--muted-foreground)]">{labels.empty}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={`${item.lessonId}:${item.traineeId}`}
                className="rounded-md border border-[var(--surface-border)] p-2"
              >
                <p className="text-sm font-medium">{item.lessonTitle}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {item.lessonTypeName} · {item.startsAtLabel}
                </p>
                <p className="mt-1 text-xs">
                  <UserQuickProfileTooltip userId={item.traineeId} locale={locale}>
                    {item.traineeName}
                  </UserQuickProfileTooltip>
                </p>
                <div className="mt-2 inline-flex flex-wrap gap-1">
                  {canGrantOpenAccess ? (
                    <Button
                      size="sm"
                      className="h-8 w-8 bg-[var(--info-bg)] p-0 text-[var(--info-fg)] hover:bg-[var(--info-hover)]"
                      onClick={() => act({ lessonId: item.lessonId, traineeId: item.traineeId, kind: "approveUnlock" })}
                      disabled={isPending || busyKey !== null}
                      title={labels.approveAndUnlockCta}
                      aria-label={labels.approveAndUnlockCta}
                    >
                      <ListChecks className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    className="h-8 w-8 bg-[var(--success-bg)] p-0 text-[var(--success-fg)] hover:bg-[var(--success-hover)] dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
                    onClick={() => act({ lessonId: item.lessonId, traineeId: item.traineeId, kind: "approve" })}
                    disabled={isPending || busyKey !== null}
                    title={labels.approveCta}
                    aria-label={labels.approveCta}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 w-8 bg-[var(--danger-bg)] p-0 text-[var(--danger-fg)] hover:bg-[var(--danger-hover)] dark:bg-rose-900/40 dark:text-rose-200 dark:hover:bg-rose-900/60"
                    onClick={() => act({ lessonId: item.lessonId, traineeId: item.traineeId, kind: "reject" })}
                    disabled={isPending || busyKey !== null}
                    title={labels.rejectCta}
                    aria-label={labels.rejectCta}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            {labels.closeCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
