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
import { PageBand } from "@/components/layout/page-band";
import { CheckRow, SegmentedTabs, SettingsSection, StatusNote } from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
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

  const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
  const envRow = (label: string, value: string) => (
    <div className="grid gap-0.5 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-4">
      <dt className="text-[15px] text-[var(--muted-foreground)]">{label}</dt>
      <dd className="break-all text-[15px]">
        {value || <span className="text-[var(--warning-fg)]">{labels.missingValue}</span>}
      </dd>
    </div>
  );
  const envFlag = (label: string, ok: boolean) => (
    <div className="grid items-center gap-1 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-4">
      <dt className="text-[15px] text-[var(--muted-foreground)]">{label}</dt>
      <dd>
        <StatusNote tone={ok ? "ok" : "warn"}>{ok ? labels.configuredValue : labels.missingValue}</StatusNote>
      </dd>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageBand title={labels.title} description={labels.subtitle}>
        <SegmentedTabs
          className="mt-5"
          value={activeTab}
          onChange={setActiveTab}
          options={(["general", "contacts", "notifications", "schedule"] as const).map((tab) => [tab, labels.tabs[tab]] as const)}
        />
      </PageBand>

      <form className="max-w-2xl" onSubmit={onSubmit}>
        {activeTab === "general" ? (
          <SettingsSection>
            <div className="space-y-1.5">
              <Label htmlFor="siteName">{labels.fields.siteName}</Label>
              <Input
                id="siteName"
                name="siteName"
                required
                value={formValues.siteName}
                onChange={(event) => setField("siteName", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="siteLogoSvg">{labels.fields.siteLogoSvg}</Label>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] ring-1 ring-[var(--rule)]">
                  <Image src={sanitizedLogoPath} alt={labels.logoPreview} width={28} height={28} />
                </span>
                <Input
                  id="siteLogoSvg"
                  name="siteLogoSvg"
                  required
                  aria-invalid={!isLogoPathValid}
                  aria-describedby={!isLogoPathValid ? "siteLogoSvg-error" : undefined}
                  value={formValues.siteLogoSvg}
                  onChange={(event) => setField("siteLogoSvg", event.target.value)}
                />
              </div>
              {!isLogoPathValid ? (
                <p id="siteLogoSvg-error" className="text-sm font-semibold text-[var(--danger-fg)]">{labels.logoPathInvalid}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weeklyResetWeekday">{labels.fields.weeklyResetWeekday}</Label>
              <select
                id="weeklyResetWeekday"
                name="weeklyResetWeekday"
                value={formValues.weeklyResetWeekday}
                onChange={(event) => setField("weeklyResetWeekday", event.target.value as typeof initialValues.weeklyResetWeekday)}
                className="ui-select w-full sm:max-w-xs"
              >
                {weekdays.map((weekday) => (
                  <option key={weekday} value={weekday}>
                    {labels.weekdays[weekday]}
                  </option>
                ))}
              </select>
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === "contacts" ? (
          <SettingsSection>
            <div className="space-y-1.5">
              <Label htmlFor="contactAddress">{labels.fields.contactAddress}</Label>
              <Input
                id="contactAddress"
                name="contactAddress"
                autoComplete="street-address"
                value={formValues.contactAddress}
                onChange={(event) => setField("contactAddress", event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail">{labels.fields.contactEmail}</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formValues.contactEmail}
                  onChange={(event) => setField("contactEmail", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone">{labels.fields.contactPhone}</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  value={formValues.contactPhone}
                  onChange={(event) => setField("contactPhone", event.target.value)}
                />
              </div>
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === "notifications" ? (
          <>
            <p className="pb-2 pt-2 text-[15px] text-[var(--muted-foreground)]">{labels.readonlyHint}</p>
            <SettingsSection title={labels.fields.smtpSectionTitle}>
              <dl className="divide-y divide-[var(--rule)]">
                {envRow(labels.fields.smtpHost, envValues.smtpHost)}
                {envRow(labels.fields.smtpPort, envValues.smtpPort)}
                {envFlag(labels.fields.smtpAuthEnabled, envValues.smtpAuthEnabled)}
                {envRow(labels.fields.smtpUser, envValues.smtpUser)}
                {envRow(labels.fields.smtpFromEmail, envValues.smtpFromEmail)}
                {envFlag(labels.fields.smtpPasswordConfigured, envValues.smtpPasswordConfigured)}
              </dl>
              <Button type="button" variant="outline" disabled={isPending || isTestingEmail} onClick={onSendTestEmail}>
                {isTestingEmail ? labels.actions.testingEmail : labels.actions.testEmail}
              </Button>
            </SettingsSection>
            <SettingsSection title={labels.fields.telegramSectionTitle}>
              <dl className="divide-y divide-[var(--rule)]">
                {envRow(labels.fields.telegramBotUsername, envValues.telegramBotUsername)}
                {envFlag(labels.fields.telegramBotTokenConfigured, envValues.telegramBotTokenConfigured)}
              </dl>
              <Button type="button" variant="outline" disabled={isPending || isTestingTelegram} onClick={onSendTestTelegram}>
                {isTestingTelegram ? labels.actions.testingTelegram : labels.actions.testTelegram}
              </Button>
            </SettingsSection>
          </>
        ) : null}

        {activeTab === "schedule" ? (
          <SettingsSection>
            <fieldset>
              <legend className="text-sm font-semibold">{labels.fields.openWeekdays}</legend>
              <div className="mt-1 grid grid-cols-2 gap-x-4 sm:grid-cols-4">
                {weekdays.map((weekday) => (
                  <CheckRow
                    key={weekday}
                    checked={formValues.openWeekdays.includes(weekday)}
                    onChange={(checked) => toggleOpenWeekday(weekday, checked)}
                  >
                    {labels.weekdays[weekday]}
                  </CheckRow>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="closedDates">{labels.fields.closedDates}</Label>
              <Textarea
                id="closedDates"
                name="closedDates"
                className="tabular sm:max-w-xs"
                aria-invalid={!areClosedDatesValid}
                aria-describedby={!areClosedDatesValid ? "closedDates-error" : undefined}
                value={formValues.closedDates}
                onChange={(event) => setField("closedDates", event.target.value)}
                rows={6}
                placeholder="YYYY-MM-DD"
              />
              {!areClosedDatesValid ? (
                <p id="closedDates-error" className="text-sm font-semibold text-[var(--danger-fg)]">
                  {labels.closedDatesInvalid}
                </p>
              ) : null}
            </div>
          </SettingsSection>
        ) : null}

        {activeTab !== "notifications" ? (
          <div className="space-y-2 border-t border-[var(--rule)] pt-5">
            {!isLogoPathValid && activeTab !== "general" ? (
              <p className="text-sm font-semibold text-[var(--danger-fg)]">{labels.logoPathInvalid}</p>
            ) : null}
            <Button type="submit" disabled={isPending || !isLogoPathValid || !areClosedDatesValid}>
              {isPending ? labels.actions.saving : labels.actions.save}
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
