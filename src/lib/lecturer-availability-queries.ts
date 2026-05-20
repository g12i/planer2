import type { QueryClient } from "@tanstack/svelte-query";
import { queryOptions } from "@tanstack/svelte-query";
import { z } from "zod";
import { http } from "$lib/http";
import {
	lecturerAvailabilityFormSchema,
	lecturerAvailabilityListItemSchema,
} from "$lib/lecturer-availability-schemas";

export const lecturerAvailabilityQueries = {
	prefix: ["lecturer-availability"] as const,

	list: () =>
		queryOptions({
			queryKey: ["lecturer-availability", "list"] as const,
			queryFn: () =>
				http({
					method: "GET",
					url: "/api/lecturer-availability",
					schema: z.array(lecturerAvailabilityListItemSchema),
				}),
		}),

	detail: (usosId: string) =>
		queryOptions({
			queryKey: ["lecturer-availability", "detail", usosId] as const,
			queryFn: () =>
				http({
					method: "GET",
					url: `/api/lecturer-availability/${encodeURIComponent(usosId)}`,
					schema: lecturerAvailabilityFormSchema,
				}),
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
