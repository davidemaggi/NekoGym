"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { confirmLessonBookingAction, rejectLessonBookingAction } from "@/app/[locale]/(app)/bookings/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  items: PendingApprovalItem[];
  canGrantOpenAccess: boolean;
  labels: {
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

/** "Rivedi le richieste": opens the approval sheet with one row per pending request. */
export function DashboardPendingApprovals({ locale, items, canGrantOpenAccess, labels }: DashboardPendingApprovalsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  function act(input: { lessonId: string; traineeId: string; kind: "approve" | "approveUnlock" | "reject" }) {
    setBusyKey(`${input.lessonId}:${input.traineeId}`);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("locale", locale);
      formData.set("lessonId", input.lessonId);
      formData.set("traineeId", input.traineeId);
      if (input.kind === "approveUnlock") formData.set("grantOpenAccess", "1");

      const result =
        input.kind === "reject" ? await rejectLessonBookingAction(formData) : await confirmLessonBookingAction(formData);

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
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-1 inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold underline decoration-[1.5px] underline-offset-4 hover:decoration-2"
        >
          {labels.openCta}
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent closeLabel={labels.closeCta}>
        <DialogHeader>
          <DialogTitle>{labels.dialogTitle}</DialogTitle>
          <DialogDescription>{labels.dialogDescription}</DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="text-[15px] text-[var(--muted-foreground)]">{labels.empty}</p>
        ) : (
          <ul className="divide-y divide-[var(--rule)]">
            {items.map((item) => {
              const busy = busyKey === `${item.lessonId}:${item.traineeId}`;
              return (
                <li key={`${item.lessonId}:${item.traineeId}`} className="py-4 first:pt-0">
                  <p className="text-[17px] font-semibold">
                    <UserQuickProfileTooltip userId={item.traineeId} locale={locale}>
                      {item.traineeName}
                    </UserQuickProfileTooltip>
                  </p>
                  <p className="mt-0.5 text-[15px] text-[var(--muted-foreground)]">
                    {item.lessonTitle} · <span className="tabular">{item.startsAtLabel}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="h-11 px-4" disabled={isPending} onClick={() => act({ ...item, kind: "approve" })}>
                      {busy ? "…" : labels.approveCta}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-11 px-4"
                      disabled={isPending}
                      onClick={() => act({ ...item, kind: "reject" })}
                    >
                      {labels.rejectCta}
                    </Button>
                    {canGrantOpenAccess ? (
                      <button
                        type="button"
                        className="inline-flex min-h-11 basis-full items-center text-[15px] font-semibold underline decoration-[1.5px] underline-offset-4 hover:decoration-2 disabled:opacity-45 sm:basis-auto"
                        disabled={isPending}
                        onClick={() => act({ ...item, kind: "approveUnlock" })}
                      >
                        {labels.approveAndUnlockCta}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
