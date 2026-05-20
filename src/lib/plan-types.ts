import type { z } from "zod";
import type {
	dayLayoutDeleteSchema,
	dayLayoutSchema,
	dayLayoutSlotSchema,
	dayLayoutUpsertSchema,
	planCreateResponseSchema,
	planCreateSchema,
	planDetailSchema,
	planDetailSemesterSchema,
	planDetailSubjectGroupSchema,
	planDetailSubjectSchema,
	planListItemSchema,
	programmeListItemSchema,
} from "$lib/plan-schemas";

export type ProgrammeListItem = z.infer<typeof programmeListItemSchema>;

export type PlanListItem = z.infer<typeof planListItemSchema>;

export type PlanCreate = z.infer<typeof planCreateSchema>;

export type PlanCreateResponse = z.infer<typeof planCreateResponseSchema>;

export type PlanDetailSubjectGroup = z.infer<
	typeof planDetailSubjectGroupSchema
>;

export type PlanDetailSubject = z.infer<typeof planDetailSubjectSchema>;

export type DayLayoutSlot = z.infer<typeof dayLayoutSlotSchema>;

export type DayLayout = z.infer<typeof dayLayoutSchema>;

export type DayLayoutUpsert = z.infer<typeof dayLayoutUpsertSchema>;

export type DayLayoutDelete = z.infer<typeof dayLayoutDeleteSchema>;

export type PlanDetailSemester = z.infer<typeof planDetailSemesterSchema>;

export type PlanDetail = z.infer<typeof planDetailSchema>;
