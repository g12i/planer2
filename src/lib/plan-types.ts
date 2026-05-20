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
	scheduleEntryCreateSchema,
	scheduleEntryDeleteSchema,
	scheduleEntrySchema,
	scheduleEntryUpdateSchema,
	subjectGroupUpdateItemSchema,
	subjectGroupsUpdateSchema,
} from "$lib/plan-schemas";

export type ProgrammeListItem = z.infer<typeof programmeListItemSchema>;

export type PlanListItem = z.infer<typeof planListItemSchema>;

export type PlanCreate = z.infer<typeof planCreateSchema>;

export type PlanCreateResponse = z.infer<typeof planCreateResponseSchema>;

export type PlanDetailSubjectGroup = z.infer<
	typeof planDetailSubjectGroupSchema
>;

export type PlanDetailSubject = z.infer<typeof planDetailSubjectSchema>;

export type SubjectGroupUpdateItem = z.infer<
	typeof subjectGroupUpdateItemSchema
>;

export type SubjectGroupsUpdate = z.infer<typeof subjectGroupsUpdateSchema>;

export type DayLayoutSlot = z.infer<typeof dayLayoutSlotSchema>;

export type DayLayout = z.infer<typeof dayLayoutSchema>;

export type DayLayoutUpsert = z.infer<typeof dayLayoutUpsertSchema>;

export type DayLayoutDelete = z.infer<typeof dayLayoutDeleteSchema>;

export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;

export type ScheduleEntryCreate = z.infer<typeof scheduleEntryCreateSchema>;

export type ScheduleEntryDelete = z.infer<typeof scheduleEntryDeleteSchema>;

export type ScheduleEntryUpdate = z.infer<typeof scheduleEntryUpdateSchema>;

export type PlanDetailSemester = z.infer<typeof planDetailSemesterSchema>;

export type PlanDetail = z.infer<typeof planDetailSchema>;
