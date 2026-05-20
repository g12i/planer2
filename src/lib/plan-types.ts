import type { z } from "zod";
import type {
	planCreateResponseSchema,
	planCreateSchema,
	planDetailSchema,
	planDetailSemesterSchema,
	planDetailSubjectSchema,
	planListItemSchema,
	programmeListItemSchema,
} from "$lib/plan-schemas";

export type ProgrammeListItem = z.infer<typeof programmeListItemSchema>;

export type PlanListItem = z.infer<typeof planListItemSchema>;

export type PlanCreate = z.infer<typeof planCreateSchema>;

export type PlanCreateResponse = z.infer<typeof planCreateResponseSchema>;

export type PlanDetailSubject = z.infer<typeof planDetailSubjectSchema>;

export type PlanDetailSemester = z.infer<typeof planDetailSemesterSchema>;

export type PlanDetail = z.infer<typeof planDetailSchema>;
