import type { QueryClient } from "@tanstack/svelte-query";
import { queryOptions } from "@tanstack/svelte-query";
import { http } from "$lib/http";
import { scheduleConflictsResponseSchema } from "$lib/schedule-conflict-schemas";

export const scheduleConflictQueries = {
	prefix: ["schedule-conflicts"] as const,

	forPlan: (planId: string) =>
		queryOptions({
			queryKey: ["schedule-conflicts", planId] as const,
			queryFn: () =>
				http({
					method: "GET",
					url: `/api/plans/${planId}/conflicts`,
					schema: scheduleConflictsResponseSchema,
				}),
			staleTime: 0,
		}),
};

export function scheduleConflictsQueryKey(planId: string) {
	return scheduleConflictQueries.forPlan(planId).queryKey;
}

export function invalidateScheduleConflicts(
	queryClient: QueryClient,
	planId: string,
) {
	return queryClient.invalidateQueries({
		queryKey: scheduleConflictsQueryKey(planId),
	});
}

export function invalidateAllScheduleConflicts(queryClient: QueryClient) {
	return queryClient.invalidateQueries({
		queryKey: scheduleConflictQueries.prefix,
	});
}
