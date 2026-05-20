import type { PlanDetail, PlanDetailSemester } from "$lib/plan-types";

export const PLAN_DETAIL_KEY = Symbol("plan-detail");

export type PlanDetailContextValue = {
	plan: PlanDetail;
	semesters: PlanDetailSemester[];
	activeSemesterId: string;
	activeSemester: PlanDetailSemester | undefined;
};
