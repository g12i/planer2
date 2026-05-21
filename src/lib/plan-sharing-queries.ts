import type { QueryClient } from "@tanstack/svelte-query";
import { queryOptions } from "@tanstack/svelte-query";
import { http } from "$lib/http";
import { planSharingListSchema } from "$lib/plan-sharing-schemas";
import type {
  PlanSharingAdd,
  PlanSharingRemove,
} from "$lib/plan-sharing-types";

export const planSharingQueries = {
  prefix: ["plans", "sharing"] as const,

  list: (planId: string) =>
    queryOptions({
      queryKey: ["plans", "sharing", planId] as const,
      queryFn: () =>
        http({
          method: "GET",
          url: `/api/plans/${planId}/sharing`,
          schema: planSharingListSchema,
        }),
    }),
};

export function invalidatePlanSharing(
  queryClient: QueryClient,
  planId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: planSharingQueries.list(planId).queryKey,
  });
}

export function addPlanEditorMutationOptions(
  queryClient: QueryClient,
  planId: string,
) {
  return {
    mutationFn: async (data: PlanSharingAdd) => {
      await http({
        method: "POST",
        url: `/api/plans/${planId}/sharing`,
        payload: data,
      });
    },
    onSuccess: async () => {
      await invalidatePlanSharing(queryClient, planId);
    },
  };
}

export function removePlanEditorMutationOptions(
  queryClient: QueryClient,
  planId: string,
) {
  return {
    mutationFn: async (data: PlanSharingRemove) => {
      await http({
        method: "DELETE",
        url: `/api/plans/${planId}/sharing`,
        payload: data,
      });
    },
    onSuccess: async () => {
      await invalidatePlanSharing(queryClient, planId);
    },
  };
}
