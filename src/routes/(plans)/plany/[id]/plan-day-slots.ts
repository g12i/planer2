import { Time } from "@internationalized/date";
import type { TimeRange } from "bits-ui";

import type { DayLayoutSlot, PlanDetailSemester } from "$lib/plan-types";

export const PLAN_GROUP_DRAG_TYPE = "application/x-planer-group";
export const PLAN_ENTRY_DRAG_TYPE = "application/x-planer-entry";

export type PlanGroupDragPayload = {
	groupId: string;
	subjectName: string;
};

export type PlanScheduleEntryDragPayload = {
	entryId: string;
	groupId: string;
};

export function acceptsScheduleDrag(types: DOMStringList | readonly string[]): boolean {
	return (
		types.includes(PLAN_ENTRY_DRAG_TYPE) ||
		types.includes(PLAN_GROUP_DRAG_TYPE) ||
		(types.includes("text/plain") && !types.includes(PLAN_GROUP_DRAG_TYPE))
	);
}

export function scheduleDragDropEffect(
	types: DOMStringList | readonly string[],
): "copy" | "move" | "none" {
	if (types.includes(PLAN_GROUP_DRAG_TYPE)) {
		return "copy";
	}
	if (
		types.includes(PLAN_ENTRY_DRAG_TYPE) ||
		(types.includes("text/plain") && !types.includes(PLAN_GROUP_DRAG_TYPE))
	) {
		return "move";
	}
	return "none";
}

export function parsePlanGroupDragPayload(
	raw: string,
): PlanGroupDragPayload | null {
	try {
		const data: unknown = JSON.parse(raw);
		if (
			data &&
			typeof data === "object" &&
			"groupId" in data &&
			typeof data.groupId === "string" &&
			data.groupId.length > 0
		) {
			return {
				groupId: data.groupId,
				subjectName:
					"subjectName" in data && typeof data.subjectName === "string"
						? data.subjectName
						: "",
			};
		}
	} catch {
		return null;
	}
	return null;
}

export function parsePlanScheduleEntryDragPayload(
	raw: string,
): PlanScheduleEntryDragPayload | null {
	try {
		const data: unknown = JSON.parse(raw);
		if (
			data &&
			typeof data === "object" &&
			"entryId" in data &&
			typeof data.entryId === "string" &&
			data.entryId.length > 0 &&
			"groupId" in data &&
			typeof data.groupId === "string" &&
			data.groupId.length > 0
		) {
			return {
				entryId: data.entryId,
				groupId: data.groupId,
			};
		}
	} catch {
		return null;
	}
	return null;
}

export const DEFAULT_DAY_SLOTS: DayLayoutSlot[] = [
	{ start: "08:30", end: "12:30" },
	{ start: "13:00", end: "17:00" },
];

export function hasCustomDayLayout(
	semester: PlanDetailSemester,
	dateIso: string,
): boolean {
	return semester.day_layouts.some((layout) => layout.date === dateIso);
}

export function getDaySlots(
	semester: PlanDetailSemester,
	dateIso: string,
): DayLayoutSlot[] {
	const layout = semester.day_layouts.find((entry) => entry.date === dateIso);
	return layout?.slots ?? DEFAULT_DAY_SLOTS;
}

export function hmToTime(hm: string): Time {
	const [hour, minute] = hm.split(":").map(Number);
	return new Time(hour, minute);
}

export function timeToHm(time: Time): string {
	return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
}

export function slotsToTimeRanges(slots: DayLayoutSlot[]): TimeRange[] {
	return slots.map((slot) => ({
		start: hmToTime(slot.start),
		end: hmToTime(slot.end),
	}));
}

export function buildSlotTimestamp(dateIso: string, timeHm: string): string {
	return `${dateIso}T${timeHm}:00`;
}

export function entryMatchesSlot(
	entryStart: string,
	dayIso: string,
	slot: DayLayoutSlot,
): boolean {
	if (!entryStart.startsWith(`${dayIso}T`)) {
		return false;
	}
	const timePart = entryStart.slice(11, 16);
	return timePart >= slot.start && timePart < slot.end;
}

export function timeRangeToSlot(range: TimeRange): DayLayoutSlot | null {
	if (!range.start || !range.end) {
		return null;
	}
	if (!(range.start instanceof Time) || !(range.end instanceof Time)) {
		return null;
	}
	return {
		start: timeToHm(range.start),
		end: timeToHm(range.end),
	};
}
