import type { QueryClient } from "@tanstack/svelte-query";
import { createMutation } from "@tanstack/svelte-query";
import { goto } from "$app/navigation";
import { invalidatePlanList } from "$lib/plan-queries";
import { planCreateResponseSchema } from "$lib/plan-schemas";
import type { PlanCreate } from "$lib/plan-types";
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
