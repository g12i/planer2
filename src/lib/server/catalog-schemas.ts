import { z } from "zod";
import { subjectActivitiesSchema } from "$lib/server/planner-schemas";

export const scrapedProgrammeListItemSchema = z.object({
  shortCode: z.string().min(1),
  name: z.string().min(1),
});

export const scrapedProgrammeVersionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  shortCode: z.string().min(1),
});

export const scrapedSubjectSchema = z.object({
  semesterNumber: z.number().int().positive(),
  moduleCode: z.string().min(1),
  moduleName: z.string().min(1),
  catalogId: z.string().min(1).nullish(),
  activities: subjectActivitiesSchema,
});

export const scrapedProgrammeBundleSchema = z.object({
  programme: scrapedProgrammeVersionSchema.extend({
    semesterCount: z.number().int().positive().nullable(),
  }),
  subjects: z.array(scrapedSubjectSchema),
});

export const catalogSyncSummarySchema = z.object({
  programmesUpserted: z.number().int().nonnegative(),
  subjectsInserted: z.number().int().nonnegative(),
  programmesTotal: z.number().int().nonnegative(),
  errors: z.array(z.string()),
});

export function parseScrapedProgrammeBundle(value: unknown) {
  return scrapedProgrammeBundleSchema.safeParse(value);
}

export function parseCatalogSyncSummary(value: unknown) {
  return catalogSyncSummarySchema.safeParse(value);
}
