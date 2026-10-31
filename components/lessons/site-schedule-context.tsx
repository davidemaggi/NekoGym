"use client";

import { createContext, useContext, type ReactNode } from "react";

type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type SiteSchedule = { openWeekdays: Weekday[]; closedDates: string[] };

const SiteScheduleContext = createContext<SiteSchedule | null>(null);

/** The gym's open weekdays and closed dates, read once by the app layout for any dialog that previews dates. */
export function SiteScheduleProvider({ value, children }: { value: SiteSchedule; children: ReactNode }) {
  return <SiteScheduleContext.Provider value={value}>{children}</SiteScheduleContext.Provider>;
}

export function useSiteSchedule(): SiteSchedule | null {
  return useContext(SiteScheduleContext);
}
