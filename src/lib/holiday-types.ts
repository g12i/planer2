import type { z } from "zod";
import type {
  openHolidaysPublicHolidaySchema,
  publicHolidayDaySchema,
} from "$lib/holiday-schemas";

export type OpenHolidaysPublicHoliday = z.infer<
  typeof openHolidaysPublicHolidaySchema
>;

export type PublicHolidayDay = z.infer<typeof publicHolidayDaySchema>;
