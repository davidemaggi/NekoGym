"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";

import {
  saveSiteSettingsAction,
  sendTestSiteEmailAction,
  sendTestSiteTelegramAction,
} from "@/app/[locale]/(app)/settings/site/actions";
import { isSiteLogoSvgPathValid, sanitizeSiteLogoSvg } from "@/lib/site-logo";
import { getInvalidClosedDateLines } from "@/lib/site-schedule";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SiteSettingsManagerProps = {
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    tabs: {
      general: string;
      contacts: string;
      notifications: string;
      schedule: string;
    };
    fields: {
      siteName: string;
      siteLogoSvg: string;
      weeklyResetWeekday: string;
      contactAddress: string;
      contactEmail: string;
      contactPhone: string;
      smtpHost: string;
      smtpPort: string;
      smtpAuthEnabled: string;
      smtpUser: string;
      smtpFromEmail: string;
      smtpPasswordConfigured: string;
      telegramBotUsername: string;
      telegramBotTokenConfigured: string;
      smtpSectionTitle: string;
      telegramSectionTitle: string;
      openWeekdays: string;
      closedDates: string;
    };
    weekdays: {
      MONDAY: string;
      TUESDAY: string;
      WEDNESDAY: string;
      THURSDAY: string;
      FRIDAY: string;
      SATURDAY: string;
      SUNDAY: string;
    };
    actions: {
      save: string;
      saving: string;
      testEmail: string;
      testingEmail: string;
      testTelegram: string;
      testingTelegram: string;
    };
    readonlyHint: string;
    configuredValue: string;
    missingValue: string;
    logoPreview: string;
    logoPathInvalid: string;
    closedDatesInvalid: string;
  };
  initialValues: {
    siteName: string;
    siteLogoSvg: string;
    weeklyResetWeekday: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
    openWeekdays: Array<"MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY">;
    closedDates: string;
    contactAddress: string;
    contactEmail: string;
    contactPhone: string;
  };
  envValues: {
    smtpHost: string;
    smtpPort: string;
    smtpAuthEnabled: boolean;
    smtpPasswordConfigured: boolean;
    smtpUser: string;
    smtpFromEmail: string;
    telegramBotUsername: string;
    telegramBotTokenConfigured: boolean;
  };
};

export function SiteSettingsManager({ locale, labels, initialValues, envValues }: SiteSettingsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isTestingEmail, startTestingEmailTransition] = useTransition();
  const [isTestingTelegram, startTestingTelegramTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"general" | "contacts" | "notifications" | "schedule">("general");
  const [formValues, setFormValues] = useState(initialValues);
  const isLogoPathValid = isSiteLogoSvgPathValid(formValues.siteLogoSvg);
  const sanitizedLogoPath = sanitizeSiteLogoSvg(formValues.siteLogoSvg);
  const invalidClosedDates = getInvalidClosedDateLines(formValues.closedDates);
  const areClosedDatesValid = invalidClosedDates.length === 0;

  function setField<K extends keyof typeof formValues>(key: K, value: (typeof formValues)[K]) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleOpenWeekday(weekday: (typeof initialValues.openWeekdays)[number], checked: boolean) {
    setFormValues((prev) => {
      const next = checked
        ? Array.from(new Set([...prev.openWeekdays, weekday]))
        : prev.openWeekdays.filter((day) => day !== weekday);
      return { ...prev, openWeekdays: next };
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("siteName", formValues.siteName);
    formData.set("siteLogoSvg", formValues.siteLogoSvg);
    formData.set("weeklyResetWeekday", formValues.weeklyResetWeekday);
    formData.set("contactAddress", formValues.contactAddress);
    formData.set("contactEmail", formValues.contactEmail);
    formData.set("contactPhone", formValues.contactPhone);
    formData.set("closedDates", formValues.closedDates);
    for (const day of formValues.openWeekdays) {
      formData.append("openWeekdays", day);
    }

    startTransition(async () => {
      const result = await saveSiteSettingsAction(formData);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function onSendTestEmail() {
    const formData = new FormData();
    formData.set("locale", locale);

    startTestingEmailTransition(async () => {
      const result = await sendTestSiteEmailAction(formData);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function onSendTestTelegram() {
    const formData = new FormData();
    formData.set("locale", locale);

    startTestingTelegramTransition(async () => {
      const result = await sendTestSiteTelegramAction(formData);
      if (result.ok) {
        toast.success(result.message);
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

      <div className="flex border-b border-[var(--surface-border)]">
        {(["general", "contacts", "notifications", "schedule"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              "px-3 py-2 text-sm",
              activeTab === tab
                ? "border-b-2 border-[var(--primary)] font-medium"
                : "text-[var(--muted-foreground)]",
            ].join(" ")}
          >
            {labels.tabs[tab]}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{labels.tabs[activeTab]}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            {activeTab === "general" ? (
              <>
                <div className="space-y-1">
                  <Label htmlFor="siteName">{labels.fields.siteName}</Label>
                  <Input
                    id="siteName"
                    name="siteName"
                    required
                    value={formValues.siteName}
                    onChange={(event) => setField("siteName", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="siteLogoSvg">{labels.fields.siteLogoSvg}</Label>
                  <Input
                    id="siteLogoSvg"
                    name="siteLogoSvg"
                    required
                    aria-invalid={!isLogoPathValid}
                    value={formValues.siteLogoSvg}
                    onChange={(event) => setField("siteLogoSvg", event.target.value)}
                  />
                  {!isLogoPathValid ? (
                    <p className="text-xs text-[var(--danger-fg)] dark:text-rose-300">{labels.logoPathInvalid}</p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weeklyResetWeekday">{labels.fields.weeklyResetWeekday}</Label>
                  <select
                    id="weeklyResetWeekday"
                    name="weeklyResetWeekday"
                    value={formValues.weeklyResetWeekday}
                    onChange={(event) => setField("weeklyResetWeekday", event.target.value as typeof initialValues.weeklyResetWeekday)}
                    className="h-10 w-full rounded-md border border-[var(--surface-border)] bg-[var(--surface)] px-3 text-sm"
                  >
                    {([
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                      "SUNDAY",
                    ] as const).map((weekday) => (
                      <option key={weekday} value={weekday}>
                        {labels.weekdays[weekday]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{labels.logoPreview}</Label>
                  <div className="inline-flex items-center gap-3 rounded-md border border-[var(--surface-border)] p-2">
                    <Image src={sanitizedLogoPath} alt={labels.fields.siteName} width={28} height={28} />
                    <span className="text-xs text-[var(--muted-foreground)]">{sanitizedLogoPath}</span>
                  </div>
                </div>
              </>
            ) : null}

            {activeTab === "contacts" ? (
              <>
                <div className="space-y-1">
                  <Label htmlFor="contactAddress">{labels.fields.contactAddress}</Label>
                  <Input
                    id="contactAddress"
                    name="contactAddress"
                    value={formValues.contactAddress}
                    onChange={(event) => setField("contactAddress", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactEmail">{labels.fields.contactEmail}</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    value={formValues.contactEmail}
                    onChange={(event) => setField("contactEmail", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPhone">{labels.fields.contactPhone}</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={formValues.contactPhone}
                    onChange={(event) => setField("contactPhone", event.target.value)}
                  />
                </div>
              </>
            ) : null}

            {activeTab === "notifications" ? (
              <>
                <p className="text-xs text-[var(--muted-foreground)]">{labels.readonlyHint}</p>

                <div className="space-y-2 rounded-md border border-[var(--surface-border)] bg-[var(--surface)] p-3">
                  <p className="text-sm font-medium">{labels.fields.smtpSectionTitle}</p>
                  <p className="text-xs"><strong>{labels.fields.smtpHost}:</strong> {envValues.smtpHost || labels.missingValue}</p>
                  <p className="text-xs"><strong>{labels.fields.smtpPort}:</strong> {envValues.smtpPort || labels.missingValue}</p>
                  <p className="text-xs"><strong>{labels.fields.smtpAuthEnabled}:</strong> {envValues.smtpAuthEnabled ? labels.configuredValue : labels.missingValue}</p>
                  <p className="text-xs"><strong>{labels.fields.smtpUser}:</strong> {envValues.smtpUser || labels.missingValue}</p>
                  <p className="text-xs"><strong>{labels.fields.smtpFromEmail}:</strong> {envValues.smtpFromEmail || labels.missingValue}</p>
                  <p className="text-xs">
                    <strong>{labels.fields.smtpPasswordConfigured}:</strong>{" "}
                    <Badge variant={envValues.smtpPasswordConfigured ? "success" : "warning"}>
                      {envValues.smtpPasswordConfigured ? labels.configuredValue : labels.missingValue}
                    </Badge>
                  </p>
                  <Button type="button" variant="outline" disabled={isPending || isTestingEmail} onClick={onSendTestEmail}>
                    {isTestingEmail ? labels.actions.testingEmail : labels.actions.testEmail}
                  </Button>
                </div>

                <div className="space-y-2 rounded-md border border-[var(--surface-border)] bg-[var(--surface)] p-3">
                  <p className="text-sm font-medium">{labels.fields.telegramSectionTitle}</p>
                  <p className="text-xs"><strong>{labels.fields.telegramBotUsername}:</strong> {envValues.telegramBotUsername || labels.missingValue}</p>
                  <p className="text-xs">
                    <strong>{labels.fields.telegramBotTokenConfigured}:</strong>{" "}
                    <Badge variant={envValues.telegramBotTokenConfigured ? "success" : "warning"}>
                      {envValues.telegramBotTokenConfigured ? labels.configuredValue : labels.missingValue}
                    </Badge>
                  </p>
                  <Button type="button" variant="outline" disabled={isPending || isTestingTelegram} onClick={onSendTestTelegram}>
                    {isTestingTelegram ? labels.actions.testingTelegram : labels.actions.testTelegram}
                  </Button>
                </div>
              </>
            ) : null}

            {activeTab === "schedule" ? (
              <>
                <div className="space-y-1">
                  <Label>{labels.fields.openWeekdays}</Label>
                  <div className="grid grid-cols-2 gap-2 rounded-md border border-[var(--surface-border)] p-2">
                    {([
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                      "SUNDAY",
                    ] as const).map((weekday) => (
                      <label key={weekday} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="openWeekdays"
                          value={weekday}
                          checked={formValues.openWeekdays.includes(weekday)}
                          onChange={(event) => toggleOpenWeekday(weekday, event.target.checked)}
                        />
                        <span>{labels.weekdays[weekday]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="closedDates">{labels.fields.closedDates}</Label>
                  <Textarea
                    id="closedDates"
                    name="closedDates"
                    value={formValues.closedDates}
                    onChange={(event) => setField("closedDates", event.target.value)}
                    rows={6}
                    placeholder="YYYY-MM-DD"
                  />
                  {!areClosedDatesValid ? (
                    <p className="text-xs text-[var(--danger-fg)] dark:text-rose-300">{labels.closedDatesInvalid}</p>
                  ) : null}
                </div>
              </>
            ) : null}

            {!isLogoPathValid ? (
              <p className="text-xs text-[var(--danger-fg)] dark:text-rose-300">{labels.logoPathInvalid}</p>
            ) : null}

            <Button type="submit" disabled={isPending || !isLogoPathValid || !areClosedDatesValid}>
              {isPending ? labels.actions.saving : labels.actions.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

