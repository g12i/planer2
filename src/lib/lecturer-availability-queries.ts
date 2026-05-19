import type { QueryClient } from "@tanstack/svelte-query";
import { queryOptions } from "@tanstack/svelte-query";
import { z } from "zod";
import {
	lecturerAvailabilityFormSchema,
	lecturerAvailabilityListItemSchema,
} from "$lib/lecturer-availability-schemas";

export const lecturerAvailabilityQueries = {
	prefix: ["lecturer-availability"] as const,

	list: () =>
		queryOptions({
			queryKey: ["lecturer-availability", "list"] as const,
			queryFn: async () => {
				const res = await fetch("/api/lecturer-availability");
				if (!res.ok) {
					throw new Error("Nie udało się pobrać listy.");
				}
				return z
					.array(lecturerAvailabilityListItemSchema)
					.parse(await res.json());
			},
		}),

	detail: (usosId: string) =>
		queryOptions({
			queryKey: ["lecturer-availability", "detail", usosId] as const,
			queryFn: async () => {
				const res = await fetch(
					`/api/lecturer-availability/${encodeURIComponent(usosId)}`,
				);
				if (!res.ok) {
					throw new Error("Nie znaleziono dostępności prowadzącego.");
				}
				return lecturerAvailabilityFormSchema.parse(await res.json());
			},
		}),
};

export function invalidateLecturerList(queryClient: QueryClient) {
	return queryClient.invalidateQueries({
		queryKey: lecturerAvailabilityQueries.list().queryKey,
	});
}

export function invalidateLecturerDetail(
	queryClient: QueryClient,
	usosId: string,
) {
	return queryClient.invalidateQueries({
		queryKey: lecturerAvailabilityQueries.detail(usosId).queryKey,
	});
}

export function removeLecturerDetail(queryClient: QueryClient, usosId: string) {
	queryClient.removeQueries({
		queryKey: lecturerAvailabilityQueries.detail(usosId).queryKey,
	});
}
