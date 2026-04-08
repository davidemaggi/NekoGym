export function getInvalidClosedDateLines(value: string): string[] {
  function isIsoDateString(input: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(input);
  }

  function isRealIsoCalendarDate(input: string): boolean {
    if (!isIsoDateString(input)) return false;
    const [yearRaw, monthRaw, dayRaw] = input.split("-");
    const year = Number.parseInt(yearRaw ?? "", 10);
    const month = Number.parseInt(monthRaw ?? "", 10);
    const day = Number.parseInt(dayRaw ?? "", 10);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return false;

    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !isRealIsoCalendarDate(line));
}

