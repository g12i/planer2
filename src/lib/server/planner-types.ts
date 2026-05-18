import type { z } from "zod";
import type {
  daySlotSchema,
  daySlotsSchema,
  subjectActivitiesSchema,
  subjectActivitySchema,
} from "$lib/server/planner-schemas";

export type SubjectActivity = z.infer<typeof subjectActivitySchema>;
export type SubjectActivities = z.infer<typeof subjectActivitiesSchema>;
export type DaySlot = z.infer<typeof daySlotSchema>;
export type DaySlots = z.infer<typeof daySlotsSchema>;
