import { z } from "zod";

export const scheduleConflictSeveritySchema = z.enum(["error", "warning"]);

export const scheduleConflictSchema = z.object({
	entry_id: z.string(),
	severity: scheduleConflictSeveritySchema,
	message: z.string(),
});

export const scheduleConflictsResponseSchema = z.object({
	conflicts: z.array(scheduleConflictSchema),
});
