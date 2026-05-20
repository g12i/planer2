import {
  expandPublicHolidaysToDays,
  openHolidaysResponseSchema,
} from "$lib/holiday-schemas";
import type { PublicHolidayDay } from "$lib/holiday-types";

const OPEN_HOLIDAYS_BASE = "https://openholidaysapi.org/PublicHolidays";

export async function fetchPolishPublicHolidays(
  validFrom: string,
  validTo: string,
): Promise<PublicHolidayDay[]> {
  const url = new URL(OPEN_HOLIDAYS_BASE);
  url.searchParams.set("countryIsoCode", "PL");
  url.searchParams.set("languageIsoCode", "PL");
  url.searchParams.set("validFrom", validFrom);
  url.searchParams.set("validTo", validTo);

  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `OpenHolidays API error: ${response.status} ${response.statusText}`,
    );
  }

  const rawJson: unknown = await response.json();
  const parsed = openHolidaysResponseSchema.safeParse(rawJson);
  if (!parsed.success) {
    throw new Error("OpenHolidays API returned unexpected JSON shape");
  }

  return expandPublicHolidaysToDays(parsed.data);
}
