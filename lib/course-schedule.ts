export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export const WEEKDAY_ORDER: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

/** "18:00" + 60 → "19:00" (wraps past midnight). */
export function addMinutesToTime(startTime: string, minutes: number): string {
  const [hours, mins] = startTime.split(":").map((part) => Number.parseInt(part, 10));
  const total = (((hours * 60 + mins + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** A course's weekly slots grouped by weekday (Monday first), each day's start times sorted. */
export function groupSlotsByWeekday(slots: Array<{ weekday: Weekday; startTime: string }>): Array<{ weekday: Weekday; times: string[] }> {
  return WEEKDAY_ORDER.map((weekday) => ({
    weekday,
    times: slots
      .filter((slot) => slot.weekday === weekday)
      .map((slot) => slot.startTime)
      .sort(),
  })).filter((day) => day.times.length > 0);
}
