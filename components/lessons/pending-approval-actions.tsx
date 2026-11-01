"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { confirmLessonBookingAction, rejectLessonBookingAction } from "@/app/[locale]/(app)/bookings/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Confirm / reject one pending booking in place, so staff never have to open "Gestisci lezione"
 * just to approve a request. Same server actions (and notifications) as the manage dialog.
 */
export function PendingApprovalActions({
  locale,
  lessonId,
  traineeId,
  traineeName,
  labels,
  className,
}: {
  locale: string;
  lessonId: string;
  traineeId: string;
  traineeName: string;
  labels: { confirm: string; reject: string };
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(kind: "confirm" | "reject") {
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lessonId);
    formData.set("traineeId", traineeId);
    startTransition(async () => {
      const result = kind === "confirm" ? await confirmLessonBookingAction(formData) : await rejectLessonBookingAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button type="button" size="sm" className="h-11 px-4" disabled={isPending} onClick={() => run("confirm")} aria-label={`${labels.confirm}: ${traineeName}`}>
        {labels.confirm}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-11 px-4"
        disabled={isPending}
        onClick={() => run("reject")}
        aria-label={`${labels.reject}: ${traineeName}`}
      >
        {labels.reject}
      </Button>
    </div>
  );
}
