import { queryOptions } from "@tanstack/svelte-query";
import { publicHolidaysResponseSchema } from "$lib/holiday-schemas";
import { http } from "$lib/http";

export const holidayQueries = {
  prefix: ["holidays"] as const,

  forRange: (from: string, to: string) =>
    queryOptions({
      queryKey: ["holidays", from, to] as const,
      queryFn: async () => {
        const days = await http({
          method: "GET",
          url: `/api/holidays?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
          schema: publicHolidaysResponseSchema,
        });

        const map = new Map<string, string>();
        for (const day of days) {
          map.set(day.date, day.name);
        }
        return map;
      },
      staleTime: Number.POSITIVE_INFINITY,
      enabled: Boolean(from && to),
    }),
};
