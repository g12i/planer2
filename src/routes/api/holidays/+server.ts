import { error, json } from "@sveltejs/kit";
import { holidaysRangeQuerySchema } from "$lib/holiday-schemas";
import { requireUser } from "$lib/server/auth";
import { fetchPolishPublicHolidays } from "$lib/server/open-holidays";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, cookies }) => {
  await requireUser(cookies);

  const parsed = holidaysRangeQuerySchema.safeParse({
    from: url.searchParams.get("from") ?? "",
    to: url.searchParams.get("to") ?? "",
  });

  if (!parsed.success) {
    error(400, parsed.error.issues[0]?.message ?? "Nieprawidłowe parametry");
  }

  const { from, to } = parsed.data;

  try {
    const holidays = await fetchPolishPublicHolidays(from, to);
    return json(holidays);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Nie udało się pobrać świąt";
    error(502, message);
  }
};
