import type { QueryClient } from "@tanstack/svelte-query";
import { createMutation } from "@tanstack/svelte-query";
import { v7 as uuidv7 } from "uuid";
import { goto } from "$app/navigation";
import {
	invalidatePlanDetail,
	invalidatePlanList,
	optimisticAddScheduleEntry,
	optimisticRemoveScheduleEntry,
	optimisticReplaceScheduleEntry,
	optimisticUpdateScheduleEntry,
	planDetailQueryKey,
} from "$lib/plan-queries";
import {
	dayLayoutSchema,
	planCreateResponseSchema,
	scheduleEntrySchema,
	subjectGroupsUpdateResponseSchema,
} from "$lib/plan-schemas";
import type {
	DayLayoutDelete,
	DayLayoutUpsert,
	PlanCreate,
	PlanDetail,
	ScheduleEntry,
	ScheduleEntryCreate,
	ScheduleEntryDelete,
	ScheduleEntryUpdate,
	SubjectGroupsUpdate,
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

export function updateSubjectGroupsMutationOptions(
	queryClient: QueryClient,
	planId: string,
) {
	return {
		mutationFn: async ({
			subjectId,
			groups,
		}: {
			subjectId: string;
			groups: SubjectGroupsUpdate;
		}) => {
			return http({
				method: "PUT",
				url: `/api/plans/${planId}/subjects/${subjectId}/groups`,
				schema: subjectGroupsUpdateResponseSchema,
				payload: groups,
			});
		},
		onSuccess: async () => {
			await invalidatePlanDetail(queryClient, planId);
		},
	};
}

type ScheduleEntryMutationContext = {
	previous: PlanDetail | undefined;
};

type CreateScheduleEntryMutationContext = ScheduleEntryMutationContext & {
	optimisticId: string;
};

export function createScheduleEntryMutationOptions(
	queryClient: QueryClient,
	planId: string,
) {
	return {
		mutationFn: async (data: ScheduleEntryCreate) => {
			return http({
				method: "POST",
				url: `/api/plans/${planId}/schedule-entries`,
				schema: scheduleEntrySchema,
				payload: data,
			});
		},
		onMutate: async (data: ScheduleEntryCreate) => {
			await queryClient.cancelQueries({
				queryKey: planDetailQueryKey(planId),
			});

			const optimisticId = uuidv7();
			const optimisticEntry: ScheduleEntry = {
				id: optimisticId,
				plan_semester_subject_group_id: data.plan_semester_subject_group_id,
				start_date_time: data.start_date_time,
				end_date_time: data.end_date_time,
				room_usos_id: null,
			};

			const previous = optimisticAddScheduleEntry(
				queryClient,
				planId,
				optimisticEntry,
			);

			return { previous, optimisticId } satisfies CreateScheduleEntryMutationContext;
		},
		onError: (
			_error: Error,
			_data: ScheduleEntryCreate,
			context: CreateScheduleEntryMutationContext | undefined,
		) => {
			if (context?.previous) {
				queryClient.setQueryData(
					planDetailQueryKey(planId),
					context.previous,
				);
			}
		},
		onSuccess: (
			entry: ScheduleEntry,
			_data: ScheduleEntryCreate,
			context: CreateScheduleEntryMutationContext | undefined,
		) => {
			if (context?.optimisticId) {
				optimisticReplaceScheduleEntry(
					queryClient,
					planId,
					context.optimisticId,
					entry,
				);
			}
		},
		onSettled: async () => {
			await invalidatePlanDetail(queryClient, planId);
		},
	};
}

export function updateScheduleEntryMutationOptions(
	queryClient: QueryClient,
	planId: string,
) {
	return {
		mutationFn: async (data: ScheduleEntryUpdate) => {
			return http({
				method: "PUT",
				url: `/api/plans/${planId}/schedule-entries`,
				schema: scheduleEntrySchema,
				payload: data,
			});
		},
		onMutate: async (data: ScheduleEntryUpdate) => {
			await queryClient.cancelQueries({
				queryKey: planDetailQueryKey(planId),
			});

			const previous = optimisticUpdateScheduleEntry(
				queryClient,
				planId,
				data.id,
				data.start_date_time,
				data.end_date_time,
			);

			return { previous } satisfies ScheduleEntryMutationContext;
		},
		onError: (
			_error: Error,
			_data: ScheduleEntryUpdate,
			context: ScheduleEntryMutationContext | undefined,
		) => {
			if (context?.previous) {
				queryClient.setQueryData(
					planDetailQueryKey(planId),
					context.previous,
				);
			}
		},
		onSuccess: (entry: ScheduleEntry) => {
			optimisticReplaceScheduleEntry(
				queryClient,
				planId,
				entry.id,
				entry,
			);
		},
		onSettled: async () => {
			await invalidatePlanDetail(queryClient, planId);
		},
	};
}

export function deleteScheduleEntryMutationOptions(
	queryClient: QueryClient,
	planId: string,
) {
	return {
		mutationFn: async (data: ScheduleEntryDelete) => {
			await http({
				method: "DELETE",
				url: `/api/plans/${planId}/schedule-entries`,
				payload: data,
			});
		},
		onMutate: async (data: ScheduleEntryDelete) => {
			await queryClient.cancelQueries({
				queryKey: planDetailQueryKey(planId),
			});

			const previous = optimisticRemoveScheduleEntry(
				queryClient,
				planId,
				data.id,
			);

			return { previous } satisfies ScheduleEntryMutationContext;
		},
		onError: (
			_error: Error,
			_data: ScheduleEntryDelete,
			context: ScheduleEntryMutationContext | undefined,
		) => {
			if (context?.previous) {
				queryClient.setQueryData(
					planDetailQueryKey(planId),
					context.previous,
				);
			}
		},
		onSettled: async () => {
			await invalidatePlanDetail(queryClient, planId);
		},
	};
}
