import { z } from "zod";
import { AVAILABILITY_PREFERENCE } from "$lib/lecturer-availability-constants";

const preferenceSchema = z.enum(
  [
    AVAILABILITY_PREFERENCE.neutral,
    AVAILABILITY_PREFERENCE.preferred,
    AVAILABILITY_PREFERENCE.unavailable,
  ],
  { error: "Wybierz preferencję" },
);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty");

export const lecturerAvailabilityListItemSchema = z.object({
  usos_id: z.string(),
  name: z.string(),
});

export const lecturerAvailabilityCreateSchema = z.object({
  usos_id: z.string().min(1, "Wybierz pracownika z listy"),
  name: z.string().min(1, "Podaj imię i nazwisko"),
});

export const lecturerAvailabilityCreateResponseSchema = z.object({
  usos_id: z.string(),
});

export const lecturerAvailabilityFormSchema = z.object({
  usos_id: z.string().min(1, "Wybierz pracownika z listy"),
  name: z.string().min(1, "Podaj imię i nazwisko"),
  day_saturday: preferenceSchema,
  day_sunday: preferenceSchema,
  slot_morning: preferenceSchema,
  slot_afternoon: preferenceSchema,
  unavailable_dates: z.array(isoDateSchema),
  notes: z.string(),
});

export function lecturerAvailabilityFormFromCreate(
  create: z.infer<typeof lecturerAvailabilityCreateSchema>,
): z.infer<typeof lecturerAvailabilityFormSchema> {
  return {
    usos_id: create.usos_id,
    name: create.name,
    day_saturday: AVAILABILITY_PREFERENCE.neutral,
    day_sunday: AVAILABILITY_PREFERENCE.neutral,
    slot_morning: AVAILABILITY_PREFERENCE.neutral,
    slot_afternoon: AVAILABILITY_PREFERENCE.neutral,
    unavailable_dates: [],
    notes: "",
  };
}

export function validateLecturerAvailabilityForm(
  values: z.input<typeof lecturerAvailabilityFormSchema>,
) {
  return lecturerAvailabilityFormSchema.safeParse(values);
}


export function preferencesToDayArrays(
  days: Record<"day_saturday" | "day_sunday", z.infer<typeof preferenceSchema>>,
): { preferred_days: number[]; unavailable_days: number[] } {
  const preferred_days: number[] = [];
  const unavailable_days: number[] = [];

  const mapping = [
    { field: "day_saturday" as const, index: 5 },
    { field: "day_sunday" as const, index: 6 },
  ];

  for (const { field, index } of mapping) {
    const value = days[field];
    if (value === AVAILABILITY_PREFERENCE.preferred) {
      preferred_days.push(index);
    } else if (value === AVAILABILITY_PREFERENCE.unavailable) {
      unavailable_days.push(index);
    }
  }

  return { preferred_days, unavailable_days };
}

export function preferencesToSlotArrays(
  slots: Record<
    "slot_morning" | "slot_afternoon",
    z.infer<typeof preferenceSchema>
  >,
): { preferred_slots: string[]; unavailable_slots: string[] } {
  const preferred_slots: string[] = [];
  const unavailable_slots: string[] = [];

  const mapping = [
    { field: "slot_morning" as const, key: "morning" },
    { field: "slot_afternoon" as const, key: "afternoon" },
  ];

  for (const { field, key } of mapping) {
    const value = slots[field];
    if (value === AVAILABILITY_PREFERENCE.preferred) {
      preferred_slots.push(key);
    } else if (value === AVAILABILITY_PREFERENCE.unavailable) {
      unavailable_slots.push(key);
    }
  }

  return { preferred_slots, unavailable_slots };
}

export function dayArraysToPreferences(
  preferred_days: number[],
  unavailable_days: number[],
): Pick<
  z.infer<typeof lecturerAvailabilityFormSchema>,
  "day_saturday" | "day_sunday"
> {
  function dayPref(index: number): z.infer<typeof preferenceSchema> {
    if (preferred_days.includes(index)) {
      return AVAILABILITY_PREFERENCE.preferred;
    }
    if (unavailable_days.includes(index)) {
      return AVAILABILITY_PREFERENCE.unavailable;
    }
    return AVAILABILITY_PREFERENCE.neutral;
  }

  return {
    day_saturday: dayPref(5),
    day_sunday: dayPref(6),
  };
}

export function slotArraysToPreferences(
  preferred_slots: string[],
  unavailable_slots: string[],
): Pick<
  z.infer<typeof lecturerAvailabilityFormSchema>,
  "slot_morning" | "slot_afternoon"
> {
  function slotPref(key: string): z.infer<typeof preferenceSchema> {
    if (preferred_slots.includes(key)) {
      return AVAILABILITY_PREFERENCE.preferred;
    }
    if (unavailable_slots.includes(key)) {
      return AVAILABILITY_PREFERENCE.unavailable;
    }
    return AVAILABILITY_PREFERENCE.neutral;
  }

  return {
    slot_morning: slotPref("morning"),
    slot_afternoon: slotPref("afternoon"),
  };
}

