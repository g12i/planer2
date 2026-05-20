import type { z } from "zod";
import type {
	scheduleConflictSchema,
	scheduleConflictSeveritySchema,
	scheduleConflictsResponseSchema,
} from "$lib/schedule-conflict-schemas";

export type ScheduleConflictSeverity = z.infer<
	typeof scheduleConflictSeveritySchema
>;

export type ScheduleConflict = z.infer<typeof scheduleConflictSchema>;

export type ScheduleConflictsResponse = z.infer<
	typeof scheduleConflictsResponseSchema
>;
