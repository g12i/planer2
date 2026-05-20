import type { QueryClient } from "@tanstack/svelte-query";
import { createMutation } from "@tanstack/svelte-query";
import { goto } from "$app/navigation";
import { invalidatePlanDetail, invalidatePlanList } from "$lib/plan-queries";
import {
	dayLayoutSchema,
	planCreateResponseSchema,
} from "$lib/plan-schemas";
import type {
	DayLayoutDelete,
	DayLayoutUpsert,
	PlanCreate,
} from "$lib/plan-types";
import { http } from "./http";

export function createPlanMutation(queryClient: QueryClient) {
	return createMutation(() => ({
		mutationFn: async (data: PlanCreate) => {
			return http({
				method: "POST",
				url: "/api/plans",
				schema: planCreateResponseSchema,
				payload: data,
			});
		},
		onSuccess: async (data) => {
			await invalidatePlanList(queryClient);
			await goto(`/plany/${data.id}`);
		},
	}));
}

export function upsertDayLayoutMutationOptions(
	queryClient: QueryClient,
	planId: string,
) {
	return {
		mutationFn: async (data: DayLayoutUpsert) => {
			return http({
				method: "PUT",
				url: `/api/plans/${planId}/day-layouts`,
				schema: dayLayoutSchema,
				payload: data,
			});
		},
		onSuccess: async () => {
			await invalidatePlanDetail(queryClient, planId);
		},
	};
}

export function deleteDayLayoutMutationOptions(
	queryClient: QueryClient,
	planId: string,
) {
	return {
		mutationFn: async (data: DayLayoutDelete) => {
			await http({
				method: "DELETE",
				url: `/api/plans/${planId}/day-layouts`,
				payload: data,
			});
		},
		onSuccess: async () => {
			await invalidatePlanDetail(queryClient, planId);
		},
	};
}
