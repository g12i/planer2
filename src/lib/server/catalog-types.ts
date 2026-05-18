import type { z } from "zod";
import type {
	catalogSyncSummarySchema,
	scrapedProgrammeBundleSchema,
	scrapedProgrammeListItemSchema,
	scrapedProgrammeVersionSchema,
	scrapedSubjectSchema,
} from "$lib/server/catalog-schemas";

export type ScrapedProgrammeListItem = z.infer<
	typeof scrapedProgrammeListItemSchema
>;
export type ScrapedProgrammeVersion = z.infer<
	typeof scrapedProgrammeVersionSchema
>;
export type ScrapedSubject = z.infer<typeof scrapedSubjectSchema>;
export type ScrapedProgrammeBundle = z.infer<
	typeof scrapedProgrammeBundleSchema
>;
export type CatalogSyncSummary = z.infer<typeof catalogSyncSummarySchema>;
