import { parseDate } from "@internationalized/date";
import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty");

const openHolidaysNameSchema = z.object({
  language: z.string(),
  text: z.string(),
});

export const openHolidaysPublicHolidaySchema = z.object({
  id: z.string(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  type: z.string(),
  name: z.array(openHolidaysNameSchema),
});

export const openHolidaysResponseSchema = z.array(
  openHolidaysPublicHolidaySchema,
);

export const holidaysRangeQuerySchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
  })
  .refine(
    (data) => parseDate(data.to).compare(parseDate(data.from)) >= 0,
    {
      message: "Data zakończenia nie może być wcześniejsza niż rozpoczęcia",
      path: ["to"],
    },
  );

export const publicHolidayDaySchema = z.object({
  date: isoDateSchema,
  name: z.string(),
});

export const publicHolidaysResponseSchema = z.array(publicHolidayDaySchema);

export function pickHolidayName(
  names: z.infer<typeof openHolidaysPublicHolidaySchema>["name"],
  languageIsoCode = "PL",
): string {
  const preferred = names.find((entry) => entry.language === languageIsoCode);
  return preferred?.text ?? names[0]?.text ?? "Święto państwowe";
}

/** Expands OpenHolidays entries (inclusive date range) into per-day rows. */
export function expandPublicHolidaysToDays(
  holidays: z.infer<typeof openHolidaysResponseSchema>,
): z.infer<typeof publicHolidaysResponseSchema> {
  const byDate = new Map<string, string>();

  for (const holiday of holidays) {
    const name = pickHolidayName(holiday.name);
    let current = parseDate(holiday.startDate);
    const end = parseDate(holiday.endDate);

    while (current.compare(end) <= 0) {
      const iso = `${String(current.year).padStart(4, "0")}-${String(current.month).padStart(2, "0")}-${String(current.day).padStart(2, "0")}`;
      byDate.set(iso, name);
      current = current.add({ days: 1 });
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, name]) => ({ date, name }));
}
