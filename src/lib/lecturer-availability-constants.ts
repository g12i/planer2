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

/** Wall-clock cutoff: start before this → morning, at/after → afternoon. */
export const SLOT_TIME_CUTOFF = "12:30";

export function timeToSlotKey(timeHm: string): "morning" | "afternoon" {
  return timeHm < SLOT_TIME_CUTOFF ? "morning" : "afternoon";
}

/** Python-style weekday (Mon=0 … Sun=6) for availability arrays. */
const WEEKDAY_LOCATIVE: Record<number, string> = {
  5: "sobotę",
  6: "niedzielę",
};

export function weekdayIndexFromIsoDate(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  const jsDay = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function weekdayLocativeLabel(weekdayIndex: number): string | null {
  return WEEKDAY_LOCATIVE[weekdayIndex] ?? null;
}

const SLOT_LABEL: Record<"morning" | "afternoon", string> = {
  morning: "pasmo poranne",
  afternoon: "pasmo popołudniowe",
};

export function slotPreferenceLabel(slotKey: "morning" | "afternoon"): string {
  return SLOT_LABEL[slotKey];
}
