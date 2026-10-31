"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { bookLessonAction, unbookLessonAction } from "@/app/[locale]/(app)/bookings/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type BookingBadgeToggleProps = {
  locale: string;
  lessonId: string;
  isBooked: boolean;
  isPendingApproval?: boolean;
  canBook: boolean;
  canUnbook: boolean;
  labels: {
    bookCta: string;
    bookedCta: string;
    pendingCta: string;
    processing: string;
    confirmUnbookTitle: string;
    confirmUnbookDescription: string;
    confirmUnbookCta: string;
    confirmKeepBookingCta: string;
  };
  className?: string;
};

export function BookingBadgeToggle({
  locale,
  lessonId,
  isBooked,
  isPendingApproval = false,
  canBook,
  canUnbook,
  labels,
  className = "",
}: BookingBadgeToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmUnbookOpen, setConfirmUnbookOpen] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("lessonId", lessonId);
      formData.set("locale", locale);

      const result = isBooked
        ? await unbookLessonAction(formData)
        : await bookLessonAction(formData);

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const disabled = isBooked ? !canUnbook || isPending : !canBook || isPending;

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (isBooked) {
            setConfirmUnbookOpen(true);
            return;
          }
          handleClick();
        }}
        disabled={disabled}
        className={[
          "inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold transition-colors",
          isBooked
            ? isPendingApproval
              ? "border-2 border-dashed border-[var(--stamp)] text-[var(--stamp)] hover:bg-[var(--stamp-soft)]"
              : "border-2 border-[var(--stamp)] text-[var(--stamp)] hover:bg-[var(--stamp-soft)]"
            : "border-[1.5px] border-[var(--foreground)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--muted)]",
          disabled ? "cursor-not-allowed opacity-60" : "",
          className,
        ].join(" ")}
      >
        {isPending ? labels.processing : isBooked ? (isPendingApproval ? labels.pendingCta : labels.bookedCta) : labels.bookCta}
      </button>

      {isBooked ? (
        <AlertDialog open={confirmUnbookOpen} onOpenChange={setConfirmUnbookOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{labels.confirmUnbookTitle}</AlertDialogTitle>
              <AlertDialogDescription>{labels.confirmUnbookDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button type="button" variant="outline">{labels.confirmKeepBookingCta}</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleClick();
                  }}
                >
                  {labels.confirmUnbookCta}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
