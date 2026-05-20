import {
	slotPreferenceLabel,
	timeToSlotKey,
	weekdayIndexFromIsoDate,
	weekdayLocativeLabel,
} from "$lib/lecturer-availability-constants";
import type { ScheduleConflict } from "$lib/schedule-conflict-types";

export type LecturerAvailabilityRow = {
	usos_id: string;
	name: string;
	unavailable_days: number[];
	preferred_days: number[];
	unavailable_slots: string[];
	preferred_slots: string[];
	unavailable_dates: string[];
};

export type PlanScheduleEntryRow = {
	id: string;
	plan_semester_subject_group_id: string;
	start_date_time: string;
	end_date_time: string;
};

export type PlanGroupRow = {
	id: string;
	lecturer_usos_id: string | null;
};

export type LecturerScheduleEntryRow = {
	entry_id: string;
	start_date_time: string;
	end_date_time: string;
	lecturer_usos_id: string;
	plan_id: string;
};

function isoDateFromDateTime(isoDateTime: string): string {
	return isoDateTime.slice(0, 10);
}

function timeHmFromDateTime(isoDateTime: string): string {
	const separatorIndex = isoDateTime.indexOf("T");
	if (separatorIndex >= 0) {
		return isoDateTime.slice(separatorIndex + 1, separatorIndex + 6);
	}
	const spaceIndex = isoDateTime.indexOf(" ");
	if (spaceIndex >= 0) {
		return isoDateTime.slice(spaceIndex + 1, spaceIndex + 6);
	}
	return "00:00";
}

function rangesOverlap(
	aStart: string,
	aEnd: string,
	bStart: string,
	bEnd: string,
): boolean {
	return aStart < bEnd && bStart < aEnd;
}

function availabilityConflictsForEntry(
	entry: PlanScheduleEntryRow,
	lecturerName: string,
	availability: LecturerAvailabilityRow,
): ScheduleConflict[] {
	const conflicts: ScheduleConflict[] = [];
	const isoDate = isoDateFromDateTime(entry.start_date_time);
	const weekday = weekdayIndexFromIsoDate(isoDate);
	const slotKey = timeToSlotKey(timeHmFromDateTime(entry.start_date_time));

	if (availability.unavailable_dates.includes(isoDate)) {
		conflicts.push({
			entry_id: entry.id,
			severity: "error",
			message: `${lecturerName} jest niedostępny w dniu ${isoDate}.`,
		});
	}

	if (availability.unavailable_days.includes(weekday)) {
		const dayLabel = weekdayLocativeLabel(weekday);
		conflicts.push({
			entry_id: entry.id,
			severity: "error",
			message: dayLabel
				? `${lecturerName} jest niedostępny w ${dayLabel}.`
				: `${lecturerName} jest niedostępny w wybranym dniu.`,
		});
	}

	if (availability.unavailable_slots.includes(slotKey)) {
		conflicts.push({
			entry_id: entry.id,
			severity: "error",
			message: `${lecturerName} jest niedostępny w ${slotPreferenceLabel(slotKey)}.`,
		});
	}

	if (
		availability.preferred_days.length > 0 &&
		!availability.preferred_days.includes(weekday)
	) {
		const dayLabel = weekdayLocativeLabel(weekday);
		conflicts.push({
			entry_id: entry.id,
			severity: "warning",
			message: dayLabel
				? `${lecturerName} preferuje inny dzień niż ${dayLabel}.`
				: `${lecturerName} preferuje inny dzień tygodnia.`,
		});
	}

	if (
		availability.preferred_slots.length > 0 &&
		!availability.preferred_slots.includes(slotKey)
	) {
		conflicts.push({
			entry_id: entry.id,
			severity: "warning",
			message: `${lecturerName} preferuje inne pasmo niż ${slotPreferenceLabel(slotKey)}.`,
		});
	}

	return conflicts;
}

function doubleBookingConflicts(
	entries: PlanScheduleEntryRow[],
	groupsById: Map<string, PlanGroupRow>,
	allYearEntries: LecturerScheduleEntryRow[],
): ScheduleConflict[] {
	const conflicts: ScheduleConflict[] = [];

	for (const entry of entries) {
		const group = groupsById.get(entry.plan_semester_subject_group_id);
		const lecturerId = group?.lecturer_usos_id;
		if (!lecturerId) {
			continue;
		}

		for (const other of allYearEntries) {
			if (other.entry_id === entry.id) {
				continue;
			}
			if (other.lecturer_usos_id !== lecturerId) {
				continue;
			}
			if (
				!rangesOverlap(
					entry.start_date_time,
					entry.end_date_time,
					other.start_date_time,
					other.end_date_time,
				)
			) {
				continue;
			}

			conflicts.push({
				entry_id: entry.id,
				severity: "error",
				message:
					"Prowadzący jest już zaplanowany w tym samym terminie.",
			});
			break;
		}
	}

	return conflicts;
}

export function computeScheduleConflicts(input: {
	entries: PlanScheduleEntryRow[];
	groups: PlanGroupRow[];
	availabilityByUsosId: Map<string, LecturerAvailabilityRow>;
	allYearEntries: LecturerScheduleEntryRow[];
}): ScheduleConflict[] {
	const groupsById = new Map(input.groups.map((group) => [group.id, group]));
	const availabilityByUsosId = input.availabilityByUsosId;

	const conflicts: ScheduleConflict[] = [];

	for (const entry of input.entries) {
		const group = groupsById.get(entry.plan_semester_subject_group_id);
		const lecturerId = group?.lecturer_usos_id;
		if (!lecturerId) {
			continue;
		}

		const availability = availabilityByUsosId.get(lecturerId);
		if (availability) {
			conflicts.push(
				...availabilityConflictsForEntry(
					entry,
					availability.name,
					availability,
				),
			);
		}
	}

	conflicts.push(
		...doubleBookingConflicts(
			input.entries,
			groupsById,
			input.allYearEntries,
		),
	);

	return conflicts;
}
