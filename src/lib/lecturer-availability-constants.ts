export const AVAILABILITY_PREFERENCE = {
  neutral: "neutral",
  preferred: "preferred",
  unavailable: "unavailable",
} as const;

export type AvailabilityPreference =
  (typeof AVAILABILITY_PREFERENCE)[keyof typeof AVAILABILITY_PREFERENCE];

export const DAY_ROWS = [
  { key: "saturday", index: 5, label: "Sobota" },
  { key: "sunday", index: 6, label: "Niedziela" },
] as const;

export const SLOT_ROWS = [
  { key: "morning", label: "Pasmo poranne" },
  { key: "afternoon", label: "Pasmo popołudniowe" },
] as const;

export const PREFERENCE_OPTIONS = [
  { value: AVAILABILITY_PREFERENCE.neutral, label: "Neutralne" },
  { value: AVAILABILITY_PREFERENCE.preferred, label: "Preferowane" },
  { value: AVAILABILITY_PREFERENCE.unavailable, label: "Niedostępne" },
] as const;
