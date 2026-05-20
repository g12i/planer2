import type { ScheduleEntry } from "$lib/plan-types";

/** Wall-clock minutes per one godzina lekcyjna (plan hour). */
export const REAL_MINUTES_PER_ACADEMIC_HOUR = 45;

export function realMinutesToAcademicHours(minutes: number): number {
	if (minutes <= 0) {
		return 0;
	}
	return minutes / REAL_MINUTES_PER_ACADEMIC_HOUR;
}

function entryRealMinutes(entry: ScheduleEntry): number {
	const startMs = Date.parse(entry.start_date_time);
	const endMs = Date.parse(entry.end_date_time);
	if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
		return 0;
	}
	return (endMs - startMs) / 60_000;
}

function entryDurationAcademicHours(entry: ScheduleEntry): number {
	return realMinutesToAcademicHours(entryRealMinutes(entry));
}

export function scheduledHoursForGroup(
	groupId: string,
	entries: ScheduleEntry[],
): number {
	let total = 0;
	for (const entry of entries) {
		if (entry.plan_semester_subject_group_id !== groupId) {
			continue;
		}
		total += entryDurationAcademicHours(entry);
	}
	return total;
}

export function remainingGroupHours(
	hoursTotal: number,
	groupId: string,
	entries: ScheduleEntry[],
): number {
	const remaining = hoursTotal - scheduledHoursForGroup(groupId, entries);
	return Math.max(0, Math.round(remaining));
}
