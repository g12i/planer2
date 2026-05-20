import type { QueryClient } from "@tanstack/svelte-query";
import { queryOptions } from "@tanstack/svelte-query";
import { z } from "zod";
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
			queryFn: async () => {
				const res = await fetch("/api/plans");
				if (!res.ok) {
					throw new Error("Nie udało się pobrać listy planów.");
				}
				return z.array(planListItemSchema).parse(await res.json());
			},
		}),

	programmes: () =>
		queryOptions({
			queryKey: ["programmes", "list"] as const,
			queryFn: async () => {
				const res = await fetch("/api/programmes");
				if (!res.ok) {
					throw new Error("Nie udało się pobrać programów studiów.");
				}
				return z.array(programmeListItemSchema).parse(await res.json());
			},
		}),

	detail: (id: string) =>
		queryOptions({
			queryKey: ["plans", "detail", id] as const,
			queryFn: async () => {
				const res = await fetch(`/api/plans/${id}`);
				if (!res.ok) {
					throw new Error("Nie udało się pobrać planu.");
				}
				return planDetailSchema.parse(await res.json());
			},
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
