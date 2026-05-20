import type { QueryClient } from "@tanstack/svelte-query";
import { queryOptions } from "@tanstack/svelte-query";
import { z } from "zod";
import { http } from "$lib/http";
import {
	planDetailSchema,
	planListItemSchema,
	programmeListItemSchema,
} from "$lib/plan-schemas";

export const planQueries = {
	prefix: ["plans"] as const,

	list: () =>
		queryOptions({
			queryKey: ["plans", "list"] as const,
			queryFn: () =>
				http({
					method: "GET",
					url: "/api/plans",
					schema: z.array(planListItemSchema),
				}),
		}),

	programmes: () =>
		queryOptions({
			queryKey: ["programmes", "list"] as const,
			queryFn: () =>
				http({
					method: "GET",
					url: "/api/programmes",
					schema: z.array(programmeListItemSchema),
				}),
		}),

	detail: (id: string) =>
		queryOptions({
			queryKey: ["plans", "detail", id] as const,
			queryFn: () =>
				http({
					method: "GET",
					url: `/api/plans/${id}`,
					schema: planDetailSchema,
				}),
		}),
};

export function invalidatePlanList(queryClient: QueryClient) {
	return queryClient.invalidateQueries({
		queryKey: planQueries.list().queryKey,
	});
}

export function invalidatePlanDetail(queryClient: QueryClient, planId: string) {
	return queryClient.invalidateQueries({
		queryKey: planQueries.detail(planId).queryKey,
	});
}
