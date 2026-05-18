import { z } from "zod";

const timeHm = /^\d{2}:\d{2}$/;

export const subjectActivitySchema = z.object({
	kind: z.string().min(1),
	hours: z.number().int().nonnegative(),
});

export const subjectActivitiesSchema = z.array(subjectActivitySchema);

export const daySlotSchema = z.object({
	start: z.string().regex(timeHm),
	end: z.string().regex(timeHm),
});

export const daySlotsSchema = z.array(daySlotSchema);

export function parseSubjectActivities(value: unknown) {
	return subjectActivitiesSchema.safeParse(value);
}

export function parseDaySlots(value: unknown) {
	return daySlotsSchema.safeParse(value);
}
