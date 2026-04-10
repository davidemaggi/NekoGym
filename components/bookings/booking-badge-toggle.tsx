"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { bookLessonAction, unbookLessonAction } from "@/app/[locale]/(app)/bookings/actions";

type BookingBadgeToggleProps = {
  locale: string;
  lessonId: string;
  isBooked: boolean;
  canBook: boolean;
  canUnbook: boolean;
  labels: {
    bookCta: string;
    bookedCta: string;
    processing: string;
  };
  className?: string;
};

export function BookingBadgeToggle({
  locale,
  lessonId,
  isBooked,
  canBook,
  canUnbook,
  labels,
  className = "",
}: BookingBadgeToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        handleClick();
      }}
      disabled={disabled}
      className={[
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition",
        isBooked
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
          : "border border-[var(--surface-border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
        disabled ? "cursor-not-allowed opacity-60" : "",
        className,
      ].join(" ")}
    >
      {isPending ? labels.processing : isBooked ? labels.bookedCta : labels.bookCta}
    </button>
  );
}
