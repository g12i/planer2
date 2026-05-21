import type { z } from "zod";
import type { usosUserSchema } from "$lib/usos-users-schemas";

export type UsosUser = z.infer<typeof usosUserSchema>;

/** USOS `services/users/search2` `among` — one primary user class (API also allows pipe-separated OR). */
export type UsosSearchAmong =
	| "all"
	| "students"
	| "current_students"
	| "staff"
	| "current_staff"
	| "current_teachers";

export type UsosUserSearchOption = {
  value: string;
  label: string;
  storedName: string;
  subtitle: string | null;
  photoUrl?: string;
};
