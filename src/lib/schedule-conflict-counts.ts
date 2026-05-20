import type { ScheduleConflict } from "$lib/schedule-conflict-types";

const plCardinal = new Intl.PluralRules("pl-PL");

type PluralCategory = ReturnType<Intl.PluralRules["select"]>;

const ERROR_FORMS = {
	one: "błąd",
	few: "błędy",
	many: "błędów",
	other: "błędów",
	zero: "błędów",
	two: "błędy",
} as const satisfies Record<PluralCategory, string>;

const WARNING_FORMS = {
	one: "ostrzeżenie",
	few: "ostrzeżenia",
	many: "ostrzeżeń",
	other: "ostrzeżeń",
	zero: "ostrzeżeń",
	two: "ostrzeżenia",
} as const satisfies Record<PluralCategory, string>;

export function formatConflictCountLabel(
	count: number,
	kind: "error" | "warning",
): string {
	const forms = kind === "error" ? ERROR_FORMS : WARNING_FORMS;
	return `${count} ${forms[plCardinal.select(count)]}`;
}

export function countConflictsBySeverity(conflicts: ScheduleConflict[]): {
	errors: number;
	warnings: number;
} {
	let errors = 0;
	let warnings = 0;

	for (const conflict of conflicts) {
		if (conflict.severity === "error") {
			errors += 1;
		} else {
			warnings += 1;
		}
	}

	return { errors, warnings };
}
