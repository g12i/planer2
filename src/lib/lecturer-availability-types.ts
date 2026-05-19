import type { z } from "zod";
import type {
  lecturerAvailabilityCreateResponseSchema,
  lecturerAvailabilityCreateSchema,
  lecturerAvailabilityFormSchema,
  lecturerAvailabilityListItemSchema,
} from "$lib/lecturer-availability-schemas";

export type LecturerAvailabilityCreate = z.infer<
  typeof lecturerAvailabilityCreateSchema
>;

export type LecturerAvailabilityCreateResponse = z.infer<
  typeof lecturerAvailabilityCreateResponseSchema
>;

export type LecturerAvailabilityForm = z.infer<
  typeof lecturerAvailabilityFormSchema
>;

export type LecturerAvailabilityListItem = z.infer<
  typeof lecturerAvailabilityListItemSchema
>;
