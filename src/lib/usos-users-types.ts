import type { z } from "zod";
import type { usosUserSchema } from "$lib/usos-users-schemas";

export type UsosUser = z.infer<typeof usosUserSchema>;

export type UsosUserSearchOption = {
  value: string;
  label: string;
  storedName: string;
  subtitle: string | null;
};
