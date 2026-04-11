"use client";

import { type ReactNode, useState, useTransition } from "react";
import { Pencil, Send } from "lucide-react";
import { toast } from "sonner";

import { broadcastLessonNotificationMutationAction } from "@/app/[locale]/(app)/lessons/standalone-create-action";
import { LessonManageDialog } from "@/app/[locale]/(app)/lessons/lesson-manage-dialog";
import { Badge } from "@/components/ui/badge";
import { UserQuickProfileTooltip } from "@/components/users/user-quick-profile-tooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LessonTypeIcon } from "@/components/ui/lesson-type-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { hexToRgba } from "@/lib/lesson-type-icons";

type LessonDetailsDialogTriggerProps = {
  locale: string;
  trigger: ReactNode;
  footerSlot?: ReactNode;
  labels: {
    detailsTitle: string;
    detailsDescription: string;
    startsAtLabel: string;
    endsAtLabel: string;
    trainerLabel: string;
    bookedLabel: string;
    queuedLabel: string;
    closeCta: string;
    courseTag: string;
    lessonDescriptionLabel: string;
    notifySectionTitle: string;
    notifyMessagePlaceholder: string;
    notifySendCta: string;
  };
  lesson: {
    id: string;
    title: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    trainerName: string | null;
    occupancy: string;
    queueLength: number;
    canViewWaitlist: boolean;
    isCourseLesson: boolean;
    lessonTypeName: string | null;
    lessonTypeIcon: string | null;
    lessonTypeColor: string | null;
    canBroadcast: boolean;
  };
  manage?: {
    lesson: {
      id: string;
      canEditMain: boolean;
      title: string;
      description: string;
      startsAt: string;
      durationMinutes: number;
      maxAttendees: number;
      cancellationWindowHours: number;
      trainerId: string;
      lessonTypeId: string;
      canManageTrainer: boolean;
      attendees: Array<{ id: string; name: string; email?: string }>;
      pendingApprovals: Array<{ id: string; name: string; email?: string }>;
      waitlist: Array<{ id: string; name: string; email?: string }>;
    };
    trainerCandidates: Array<{ id: string; name: string }>;
    lessonTypeCandidates: Array<{ id: string; name: string }>;
    attendeeCandidates: Array<{ id: string; name: string; email?: string }>;
    labels: {
      title: string;
      description: string;
      tabMain: string;
      tabPeople: string;
      startsAtLabel: string;
      trainerLabel: string;
      standaloneDuration: string;
      standaloneMaxAttendees: string;
      standaloneCancellationWindow: string;
      standaloneLessonType: string;
      lessonTitleLabel: string;
      lessonDescriptionLabel: string;
      updateStandaloneCta: string;
      updateTrainerCta: string;
      attendeesLabel: string;
      noAttendees: string;
      attendeeSelectLabel: string;
      addAttendeeCta: string;
      removeAttendeeCta: string;
      pendingApprovalsLabel: string;
      noPendingApprovals: string;
      confirmPendingCta: string;
      confirmPendingAndGrantAccessCta: string;
      rejectPendingCta: string;
      waitlistLabel: string;
      noWaitlist: string;
      confirmWaitlistCta: string;
      removeWaitlistCta: string;
      processing: string;
      closeCta: string;
      manageTriggerLabel: string;
      notifySectionTitle: string;
      notifyMessageLabel: string;
      notifyMessagePlaceholder: string;
      notifySendCta: string;
    };
    canBroadcastToAttendees?: boolean;
  };
};

function formatDateTime(value: string, locale: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function LessonDetailsDialogTrigger({ locale, trigger, footerSlot, labels, lesson, manage }: LessonDetailsDialogTriggerProps) {
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState<"info" | "people">("info");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const peopleCount = manage
    ? manage.lesson.attendees.length + manage.lesson.pendingApprovals.length + manage.lesson.waitlist.length
    : 0;

  function closeDialog() {
    setOpen(false);
    setDetailsTab("info");
    setMessage("");
  }

  function sendNotification() {
    if (!lesson.canBroadcast || !message.trim()) return;
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("lessonId", lesson.id);
    formData.set("message", message.trim());

    startTransition(async () => {
      const result = await broadcastLessonNotificationMutationAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setMessage("");
      } else {
        toast.error(result.message);
      }
    });
  }

  const infoPanel = (
    <div
      className="space-y-2 rounded-md p-2 text-sm"
      style={
        lesson.lessonTypeColor
          ? {
              backgroundColor: hexToRgba(lesson.lessonTypeColor, 0.14),
              border: `1px solid ${hexToRgba(lesson.lessonTypeColor, 0.45)}`,
            }
          : undefined
      }
    >
      {lesson.description ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          {labels.lessonDescriptionLabel}: {lesson.description}
        </p>
      ) : null}
      <p>{labels.startsAtLabel}: {formatDateTime(lesson.startsAt, locale)}</p>
      <p>{labels.endsAtLabel}: {formatDateTime(lesson.endsAt, locale)}</p>
      <p>{labels.trainerLabel}: {lesson.trainerName ?? "-"}</p>
      <p>{labels.bookedLabel}: {lesson.occupancy}</p>
      {lesson.canViewWaitlist ? <p>{labels.queuedLabel}: {lesson.queueLength}</p> : null}
      {lesson.isCourseLesson ? (
        <Badge variant="info">{labels.courseTag}</Badge>
      ) : null}
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        {lesson.lessonTypeIcon ? (
          <LessonTypeIcon
            iconPath={lesson.lessonTypeIcon}
            colorHex={lesson.lessonTypeColor}
            size={16}
            title={lesson.lessonTypeName ?? undefined}
          />
        ) : null}
        <span>{lesson.lessonTypeName ?? "-"}</span>
      </div>
      {lesson.canBroadcast ? (
        <div className="space-y-1 border-t border-[var(--surface-border)] pt-2">
          <p className="text-sm font-semibold">{labels.notifySectionTitle}</p>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            placeholder={labels.notifyMessagePlaceholder}
            disabled={isPending}
          />
          <Button type="button" onClick={sendNotification} disabled={isPending || !message.trim()} className="gap-1">
            <Send className="h-4 w-4" />
            <span>{labels.notifySendCta}</span>
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
        {trigger}
      </button>
      <Dialog open={open} onOpenChange={(next) => (!next ? closeDialog() : setOpen(next))}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start gap-3">
              {lesson.lessonTypeIcon ? (
                <span
                  className="inline-flex h-16 w-16 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: lesson.lessonTypeColor ? hexToRgba(lesson.lessonTypeColor, 0.18) : undefined,
                    border: lesson.lessonTypeColor ? `1px solid ${hexToRgba(lesson.lessonTypeColor, 0.5)}` : undefined,
                  }}
                >
                  <LessonTypeIcon
                    iconPath={lesson.lessonTypeIcon}
                    colorHex={lesson.lessonTypeColor}
                    size={44}
                    title={lesson.lessonTypeName ?? undefined}
                  />
                </span>
              ) : null}
              <div className="space-y-1">
                <DialogTitle>{lesson.title}</DialogTitle>
                <DialogDescription>{labels.detailsDescription}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {manage ? (
            <Tabs value={detailsTab} onValueChange={(value) => setDetailsTab(value === "people" ? "people" : "info")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">{manage.labels.tabMain}</TabsTrigger>
                <TabsTrigger value="people" title={`${manage.labels.tabPeople} (${peopleCount})`}>
                  <span>{manage.labels.tabPeople}</span>
                  <Badge variant="neutral" className="ml-1 h-5 min-w-5 px-1 text-[10px] leading-none">
                    {peopleCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info">{infoPanel}</TabsContent>

              <TabsContent value="people" className="mt-0">
                <div className="space-y-2 rounded-md border border-[var(--surface-border)] p-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-medium">{manage.labels.attendeesLabel}</p>
                    {manage.lesson.attendees.length === 0 ? (
                      <p className="text-xs text-[var(--muted-foreground)]">{manage.labels.noAttendees}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {manage.lesson.attendees.map((attendee) => (
                          <span key={`detail-attendee-${lesson.id}-${attendee.id}`} className="rounded border border-[var(--surface-border)] px-2 py-0.5 text-xs">
                            <UserQuickProfileTooltip userId={attendee.id} locale={locale}>
                              {attendee.name}
                            </UserQuickProfileTooltip>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium">{manage.labels.pendingApprovalsLabel}</p>
                    {manage.lesson.pendingApprovals.length === 0 ? (
                      <p className="text-xs text-[var(--muted-foreground)]">{manage.labels.noPendingApprovals}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {manage.lesson.pendingApprovals.map((pendingUser) => (
                          <span key={`detail-pending-${lesson.id}-${pendingUser.id}`} className="rounded border border-[var(--surface-border)] px-2 py-0.5 text-xs">
                            <UserQuickProfileTooltip userId={pendingUser.id} locale={locale}>
                              {pendingUser.name}
                            </UserQuickProfileTooltip>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium">{manage.labels.waitlistLabel}</p>
                    {manage.lesson.waitlist.length === 0 ? (
                      <p className="text-xs text-[var(--muted-foreground)]">{manage.labels.noWaitlist}</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {manage.lesson.waitlist.map((queuedUser) => (
                          <span key={`detail-waitlist-${lesson.id}-${queuedUser.id}`} className="rounded border border-[var(--surface-border)] px-2 py-0.5 text-xs">
                            <UserQuickProfileTooltip userId={queuedUser.id} locale={locale}>
                              {queuedUser.name}
                            </UserQuickProfileTooltip>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            infoPanel
          )}

          <DialogFooter>
            {manage ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setManageOpen(true);
                }}
                aria-label={manage.labels.manageTriggerLabel}
                title={manage.labels.manageTriggerLabel}
                className="gap-1"
              >
                <Pencil className="h-4 w-4" />
                <span>{manage.labels.manageTriggerLabel}</span>
              </Button>
            ) : null}
            {footerSlot}
            <Button type="button" variant="secondary" onClick={closeDialog}>
              {labels.closeCta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {manage ? (
        <LessonManageDialog
          open={manageOpen}
          showDefaultTrigger={false}
          onOpenChangeAction={(next) => setManageOpen(next)}
          locale={locale}
          lesson={manage.lesson}
          trainerCandidates={manage.trainerCandidates}
          lessonTypeCandidates={manage.lessonTypeCandidates}
          attendeeCandidates={manage.attendeeCandidates}
          canBroadcastToAttendees={manage.canBroadcastToAttendees}
          labels={manage.labels}
        />
      ) : null}
    </>
  );
}
