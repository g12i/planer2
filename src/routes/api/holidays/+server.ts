import { error, json } from "@sveltejs/kit";
import { holidaysRangeQuerySchema } from "$lib/holiday-schemas";
import { fetchPolishPublicHolidays } from "$lib/server/open-holidays";
import { getSessionUser, parseSessionId } from "$lib/server/auth";
import { getSessionCookieName } from "$lib/server/session";
import type { RequestHandler } from "./$types";

async function requireUser(cookies: {
  get: (name: string) => string | undefined;
}) {
  const sessionId = parseSessionId(cookies.get(getSessionCookieName()));
  if (!sessionId) {
    error(401, "Unauthorized");
  }

  const user = await getSessionUser(sessionId);
  if (!user) {
    error(401, "Unauthorized");
  }

  return user;
}

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
