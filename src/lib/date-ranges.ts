import { type DateValue, parseDate } from "@internationalized/date";

/** ISO calendar date (yyyy-MM-dd) from a Bits UI / @internationalized/date value. */
export function dateValueToIso(value: DateValue): string {
  return `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

export type IsoDateRange = {
  start: string;
  end: string;
  dates: string[];
};

function isNextCalendarDay(previousIso: string, nextIso: string): boolean {
  return (
    parseDate(previousIso).add({ days: 1 }).compare(parseDate(nextIso)) === 0
  );
}

/** Groups sorted ISO date strings (yyyy-MM-dd) into consecutive ranges. */
export function groupConsecutiveIsoDates(dates: string[]): IsoDateRange[] {
  if (dates.length === 0) {
    return [];
  }

  const sorted = [...dates].sort();
  const ranges: IsoDateRange[] = [];
  let start = sorted[0];
  let end = sorted[0];
  let currentDates = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const date = sorted[index];

    if (isNextCalendarDay(end, date)) {
      end = date;
      currentDates.push(date);
      continue;
    }

    ranges.push({ start, end, dates: currentDates });
    start = date;
    end = date;
    currentDates = [date];
  }

  ranges.push({ start, end, dates: currentDates });
  return ranges;
}

export function formatIsoDateRange(range: IsoDateRange): string {
  return range.start === range.end
    ? range.start
    : `${range.start} – ${range.end}`;
}

export type WeekendPair = {
  saturday: string;
  sunday: string;
};

const isoDayLabelFormatter = new Intl.DateTimeFormat("pl-PL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Polish short label for an ISO date, e.g. "sob. 14 mar 2026". */
export function formatIsoDayLabel(iso: string): string {
  const date = parseDate(iso);
  return isoDayLabelFormatter.format(
    new Date(date.year, date.month - 1, date.day),
  );
}

/** Saturday–Sunday pairs between two ISO dates (inclusive). */
export function getWeekends(startIso: string, endIso: string): WeekendPair[] {
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  const weekends: WeekendPair[] = [];

  let current = start;
  while (current.compare(end) <= 0) {
    const jsDay = new Date(
      current.year,
      current.month - 1,
      current.day,
    ).getDay();
    if (jsDay === 6) {
      const sunday = current.add({ days: 1 });
      weekends.push({
        saturday: dateValueToIso(current),
        sunday: dateValueToIso(sunday),
      });
    }
    current = current.add({ days: 1 });
  }

  return weekends;
}
