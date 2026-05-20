import type { QueryClient } from "@tanstack/svelte-query";
import { queryOptions } from "@tanstack/svelte-query";
import { z } from "zod";
import { http } from "$lib/http";
import {
	planDetailSchema,
	planListItemSchema,
	programmeListItemSchema,
} from "$lib/plan-schemas";
import type { PlanDetail, ScheduleEntry } from "$lib/plan-types";

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

export function planDetailQueryKey(planId: string) {
	return planQueries.detail(planId).queryKey;
}

export function findSemesterIdForGroup(
	plan: PlanDetail,
	groupId: string,
): string | null {
	for (const semester of plan.semesters) {
		for (const subject of semester.subjects) {
			if (subject.groups.some((group) => group.id === groupId)) {
				return semester.id;
			}
		}
	}
	return null;
}

function setPlanDetailCache(
	queryClient: QueryClient,
	planId: string,
	updater: (plan: PlanDetail) => PlanDetail,
): PlanDetail | undefined {
	const queryKey = planDetailQueryKey(planId);
	const previous = queryClient.getQueryData<PlanDetail>(queryKey);
	if (!previous) {
		return undefined;
	}

	queryClient.setQueryData(queryKey, planDetailSchema.parse(updater(previous)));
	return previous;
}

export function optimisticAddScheduleEntry(
	queryClient: QueryClient,
	planId: string,
	entry: ScheduleEntry,
): PlanDetail | undefined {
	return setPlanDetailCache(queryClient, planId, (plan) => {
		const semesterId = findSemesterIdForGroup(
			plan,
			entry.plan_semester_subject_group_id,
		);
		if (!semesterId) {
			return plan;
		}

		return {
			...plan,
			semesters: plan.semesters.map((semester) =>
				semester.id === semesterId
					? {
							...semester,
							schedule_entries: [...semester.schedule_entries, entry],
						}
					: semester,
			),
		};
	});
}

export function optimisticRemoveScheduleEntry(
	queryClient: QueryClient,
	planId: string,
	entryId: string,
): PlanDetail | undefined {
	return setPlanDetailCache(queryClient, planId, (plan) => ({
		...plan,
		semesters: plan.semesters.map((semester) => ({
			...semester,
			schedule_entries: semester.schedule_entries.filter(
				(entry) => entry.id !== entryId,
			),
		})),
	}));
}

export function optimisticReplaceScheduleEntry(
	queryClient: QueryClient,
	planId: string,
	optimisticId: string,
	entry: ScheduleEntry,
): void {
	setPlanDetailCache(queryClient, planId, (plan) => ({
		...plan,
		semesters: plan.semesters.map((semester) => ({
			...semester,
			schedule_entries: semester.schedule_entries.map((existing) =>
				existing.id === optimisticId ? entry : existing,
			),
		})),
	}));
}

export function optimisticUpdateScheduleEntry(
	queryClient: QueryClient,
	planId: string,
	entryId: string,
	startDateTime: string,
	endDateTime: string,
): PlanDetail | undefined {
	return setPlanDetailCache(queryClient, planId, (plan) => ({
		...plan,
		semesters: plan.semesters.map((semester) => ({
			...semester,
			schedule_entries: semester.schedule_entries.map((entry) =>
				entry.id === entryId
					? {
							...entry,
							start_date_time: startDateTime,
							end_date_time: endDateTime,
						}
					: entry,
			),
		})),
	}));
}
