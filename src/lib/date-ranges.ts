import { parseDate } from "@internationalized/date";

export type IsoDateRange = {
  start: string;
  end: string;
  dates: string[];
};

function isNextCalendarDay(previousIso: string, nextIso: string): boolean {
  return parseDate(previousIso).add({ days: 1 }).compare(parseDate(nextIso)) === 0;
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
  return range.start === range.end ? range.start : `${range.start} – ${range.end}`;
}
