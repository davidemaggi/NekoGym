"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { repeatLessonMutationAction } from "@/app/[locale]/(app)/lessons/standalone-create-action";
import { RepeatControls } from "@/components/lessons/repeat-controls";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { appDateKey } from "@/lib/date-time";
import { addDaysToKey } from "@/lib/lesson-recurrence";

const COPY = {
  it: {
    title: "Ripeti lezione",
    description: (name: string) =>
      `Crea copie di "${name}" alla stessa ora, con gli stessi dettagli e senza iscritti. Ogni copia è una lezione a sé.`,
    submit: "Crea copie",
    processing: "Creazione…",
    cancel: "Annulla",
  },
  en: {
    title: "Repeat lesson",
    description: (name: string) =>
      `Create copies of "${name}" at the same time, with the same details and no attendees. Each copy is its own lesson.`,
    submit: "Create copies",
    processing: "Creating…",
    cancel: "Cancel",
  },
} as const;

/** "Ripeti…" on an existing standalone lesson: independent copies on the days chosen after it. */
export function RepeatLessonDialog({
  locale,
  lesson,
  open,
  onOpenChange,
}: {
  locale: string;
  lesson: { id: string; title: string; startsAt: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = locale === "it" ? COPY.it : COPY.en;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const firstDay = addDaysToKey(appDateKey(lesson.startsAt), 1);

  function submit(formData: FormData) {
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    startTransition(async () => {
      const result = await repeatLessonMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description(lesson.title)}</DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          {/* Remounted on every open, so the options start fresh. */}
          {open ? <RepeatControls locale={locale} idPrefix={`repeat-${lesson.id}`} firstDay={firstDay} allowNone={false} /> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t.processing : t.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
