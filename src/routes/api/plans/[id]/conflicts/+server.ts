import { error, json } from "@sveltejs/kit";
import { scheduleConflictsResponseSchema } from "$lib/schedule-conflict-schemas";
import { requireUser } from "$lib/server/auth";
import {
	computeScheduleConflicts,
	type LecturerAvailabilityRow,
	type LecturerScheduleEntryRow,
	type PlanGroupRow,
	type PlanScheduleEntryRow,
} from "$lib/server/schedule-conflicts";
import { getSupabase } from "$lib/server/supabase";
import type { RequestHandler } from "./$types";

async function requirePlanOwnership(planId: string, userId: string) {
	const { data: ownership, error: ownershipError } = await getSupabase()
		.from("plan_ownership")
		.select("plan_id")
		.eq("plan_id", planId)
		.eq("user_id", userId)
		.maybeSingle();

	if (ownershipError) {
		throw new Error(
			`Failed to verify plan ownership: ${ownershipError.message}`,
		);
	}

	if (!ownership) {
		error(404, "Nie znaleziono planu.");
	}
}

export const GET: RequestHandler = async ({ params, cookies }) => {
	const user = await requireUser(cookies);
	const planId = params.id;
	await requirePlanOwnership(planId, user.id);

	const { data: plan, error: planError } = await getSupabase()
		.from("plan")
		.select("academic_year")
		.eq("id", planId)
		.maybeSingle();

	if (planError) {
		throw new Error(`Failed to load plan: ${planError.message}`);
	}

	if (!plan) {
		error(404, "Nie znaleziono planu.");
	}

	const { data: semesters, error: semestersError } = await getSupabase()
		.from("plan_semester")
		.select("id")
		.eq("plan_id", planId);

	if (semestersError) {
		throw new Error(`Failed to load semesters: ${semestersError.message}`);
	}

	const semesterIds = semesters.map((semester) => semester.id);
	if (semesterIds.length === 0) {
		return json(scheduleConflictsResponseSchema.parse({ conflicts: [] }));
	}

	const { data: subjects, error: subjectsError } = await getSupabase()
		.from("plan_semester_subject")
		.select("id")
		.in("plan_semester_id", semesterIds);

	if (subjectsError) {
		throw new Error(`Failed to load subjects: ${subjectsError.message}`);
	}

	const subjectIds = subjects.map((subject) => subject.id);
	if (subjectIds.length === 0) {
		return json(scheduleConflictsResponseSchema.parse({ conflicts: [] }));
	}

	const { data: groups, error: groupsError } = await getSupabase()
		.from("plan_semester_subject_group")
		.select("id, lecturer_usos_id")
		.in("plan_semester_subject_id", subjectIds);

	if (groupsError) {
		throw new Error(`Failed to load groups: ${groupsError.message}`);
	}

	const groupRows: PlanGroupRow[] = groups.map((group) => ({
		id: group.id,
		lecturer_usos_id: group.lecturer_usos_id,
	}));

	const groupIds = groups.map((group) => group.id);
	if (groupIds.length === 0) {
		return json(scheduleConflictsResponseSchema.parse({ conflicts: [] }));
	}

	const { data: entries, error: entriesError } = await getSupabase()
		.from("plan_schedule_entry")
		.select(
			"id, plan_semester_subject_group_id, start_date_time, end_date_time",
		)
		.in("plan_semester_subject_group_id", groupIds)
		.order("start_date_time")
		.order("id");

	if (entriesError) {
		throw new Error(
			`Failed to load schedule entries: ${entriesError.message}`,
		);
	}

	const entryRows: PlanScheduleEntryRow[] = entries.map((entry) => ({
		id: entry.id,
		plan_semester_subject_group_id: entry.plan_semester_subject_group_id,
		start_date_time: entry.start_date_time,
		end_date_time: entry.end_date_time,
	}));

	const lecturerIds = [
		...new Set(
			groupRows
				.map((group) => group.lecturer_usos_id)
				.filter((id): id is string => Boolean(id)),
		),
	];

	if (lecturerIds.length === 0) {
		return json(scheduleConflictsResponseSchema.parse({ conflicts: [] }));
	}

	const availabilityByUsosId = new Map<string, LecturerAvailabilityRow>();

	const { data: availabilityRows, error: availabilityError } =
		await getSupabase()
			.from("lecturer_availability")
			.select(
				"usos_id, name, unavailable_days, preferred_days, unavailable_slots, preferred_slots, unavailable_dates",
			)
			.in("usos_id", lecturerIds);

	if (availabilityError) {
		throw new Error(
			`Failed to load lecturer availability: ${availabilityError.message}`,
		);
	}

	for (const row of availabilityRows) {
		availabilityByUsosId.set(row.usos_id, {
			usos_id: row.usos_id,
			name: row.name,
			unavailable_days: row.unavailable_days,
			preferred_days: row.preferred_days,
			unavailable_slots: row.unavailable_slots,
			preferred_slots: row.preferred_slots,
			unavailable_dates: row.unavailable_dates,
		});
	}

	let allYearEntries: LecturerScheduleEntryRow[] = [];

	const { data: yearEntries, error: yearEntriesError } = await getSupabase()
		.from("lecturer_schedule_entries")
		.select(
			"entry_id, start_date_time, end_date_time, lecturer_usos_id, plan_id",
		)
		.in("lecturer_usos_id", lecturerIds)
		.eq("academic_year", plan.academic_year);

	if (yearEntriesError) {
		console.error(
			`lecturer_schedule_entries view unavailable, skipping cross-plan conflicts: ${yearEntriesError.message}`,
		);
	} else {
		allYearEntries = yearEntries.map((row) => ({
			entry_id: row.entry_id,
			start_date_time: row.start_date_time,
			end_date_time: row.end_date_time,
			lecturer_usos_id: row.lecturer_usos_id,
			plan_id: row.plan_id,
		}));
	}

	const conflicts = computeScheduleConflicts({
		entries: entryRows,
		groups: groupRows,
		availabilityByUsosId,
		allYearEntries,
	});

	return json(scheduleConflictsResponseSchema.parse({ conflicts }));
};
