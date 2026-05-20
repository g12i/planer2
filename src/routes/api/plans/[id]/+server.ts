import { error, json } from "@sveltejs/kit";
import {
	dayLayoutSchema,
	planDetailSchema,
	planUpdateSchema,
	scheduleEntrySchema,
} from "$lib/plan-schemas";
import { parseDaySlots } from "$lib/server/planner-schemas";
import type { DayLayout, PlanDetail, ScheduleEntry } from "$lib/plan-types";
import { requireUser } from "$lib/server/auth";
import { getSupabase } from "$lib/server/supabase";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, cookies }) => {
	const user = await requireUser(cookies);
	const planId = params.id;

	const { data: ownership, error: ownershipError } = await getSupabase()
		.from("plan_ownership")
		.select("plan_id")
		.eq("plan_id", planId)
		.eq("user_id", user.id)
		.maybeSingle();

	if (ownershipError) {
		throw new Error(
			`Failed to verify plan ownership: ${ownershipError.message}`,
		);
	}

	if (!ownership) {
		error(404, "Nie znaleziono planu.");
	}

	const { data: plan, error: planError } = await getSupabase()
		.from("plan")
		.select("id, name, programme_code, programme_name, academic_year")
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
		.select("id, number, start_date, end_date")
		.eq("plan_id", planId)
		.order("number");

	if (semestersError) {
		throw new Error(`Failed to load semesters: ${semestersError.message}`);
	}

	type SubjectRow = {
		id: string;
		module_code: string | null;
		module_name: string;
		groups: {
			id: string;
			activity_kind: string;
			hours_total: number;
			group_index: number;
			label: string | null;
			lecturer_usos_id: string | null;
		}[];
	};

	const semesterIds = semesters.map((semester) => semester.id);
	const subjectsBySemesterId = new Map<string, SubjectRow[]>();
	const dayLayoutsBySemesterId = new Map<string, DayLayout[]>();
	const scheduleEntriesBySemesterId = new Map<string, ScheduleEntry[]>();
	const groupIdToSemesterId = new Map<string, string>();

	if (semesterIds.length > 0) {
		const { data: dayLayouts, error: dayLayoutsError } = await getSupabase()
			.from("plan_semester_day_layout")
			.select("id, plan_semester_id, date, slots")
			.in("plan_semester_id", semesterIds)
			.order("date");

		if (dayLayoutsError) {
			throw new Error(
				`Failed to load day layouts: ${dayLayoutsError.message}`,
			);
		}

		for (const row of dayLayouts) {
			const parsedSlots = parseDaySlots(row.slots);
			if (!parsedSlots.success) {
				throw new Error(
					`Invalid day layout slots for ${row.id}: ${parsedSlots.error.message}`,
				);
			}

			const layout = dayLayoutSchema.parse({
				id: row.id,
				date: row.date,
				plan_semester_id: row.plan_semester_id,
				slots: parsedSlots.data,
			});

			const list = dayLayoutsBySemesterId.get(row.plan_semester_id) ?? [];
			list.push(layout);
			dayLayoutsBySemesterId.set(row.plan_semester_id, list);
		}
		const { data: subjects, error: subjectsError } = await getSupabase()
			.from("plan_semester_subject")
			.select("id, plan_semester_id, module_code, module_name")
			.in("plan_semester_id", semesterIds)
			.order("module_name");

		if (subjectsError) {
			throw new Error(`Failed to load subjects: ${subjectsError.message}`);
		}

		const subjectIds = subjects.map((subject) => subject.id);
		const groupsBySubjectId = new Map<string, SubjectRow["groups"]>();

		if (subjectIds.length > 0) {
			const { data: groups, error: groupsError } = await getSupabase()
				.from("plan_semester_subject_group")
				.select(
					"id, plan_semester_subject_id, activity_kind, hours_total, group_index, label, lecturer_usos_id, room_usos_id",
				)
				.in("plan_semester_subject_id", subjectIds)
				.order("activity_kind")
				.order("group_index");

			if (groupsError) {
				throw new Error(`Failed to load groups: ${groupsError.message}`);
			}

			const subjectIdToSemesterId = new Map(
				subjects.map((s) => [s.id, s.plan_semester_id]),
			);

			for (const group of groups) {
				const list = groupsBySubjectId.get(group.plan_semester_subject_id) ?? [];
				list.push({
					id: group.id,
					activity_kind: group.activity_kind,
					hours_total: group.hours_total,
					group_index: group.group_index,
					label: group.label,
					lecturer_usos_id: group.lecturer_usos_id,
					room_usos_id: group.room_usos_id,
				});
				groupsBySubjectId.set(group.plan_semester_subject_id, list);

				const semesterId = subjectIdToSemesterId.get(
					group.plan_semester_subject_id,
				);
				if (semesterId) {
					groupIdToSemesterId.set(group.id, semesterId);
				}
			}

			const groupIds = groups.map((group) => group.id);
			if (groupIds.length > 0) {
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

				for (const row of entries) {
					const semesterId = groupIdToSemesterId.get(
						row.plan_semester_subject_group_id,
					);
					if (!semesterId) {
						continue;
					}

					const entry = scheduleEntrySchema.parse({
						id: row.id,
						plan_semester_subject_group_id:
							row.plan_semester_subject_group_id,
						start_date_time: row.start_date_time,
						end_date_time: row.end_date_time,
					});

					const list = scheduleEntriesBySemesterId.get(semesterId) ?? [];
					list.push(entry);
					scheduleEntriesBySemesterId.set(semesterId, list);
				}
			}
		}

		for (const subject of subjects) {
			const list = subjectsBySemesterId.get(subject.plan_semester_id) ?? [];
			list.push({
				id: subject.id,
				module_code: subject.module_code,
				module_name: subject.module_name,
				groups: groupsBySubjectId.get(subject.id) ?? [],
			});
			subjectsBySemesterId.set(subject.plan_semester_id, list);
		}
	}

	const response: PlanDetail = {
		id: plan.id,
		name: plan.name,
		programme_code: plan.programme_code,
		programme_name: plan.programme_name,
		academic_year: plan.academic_year,
		semesters: semesters.map((semester) => ({
			id: semester.id,
			number: semester.number,
			start_date: semester.start_date,
			end_date: semester.end_date,
			subjects: subjectsBySemesterId.get(semester.id) ?? [],
			day_layouts: dayLayoutsBySemesterId.get(semester.id) ?? [],
			schedule_entries:
				scheduleEntriesBySemesterId.get(semester.id) ?? [],
		})),
	};

	return json(planDetailSchema.parse(response));
};

export const PATCH: RequestHandler = async ({ params, cookies, request }) => {
	const user = await requireUser(cookies);
	const planId = params.id;

	const { data: ownership, error: ownershipError } = await getSupabase()
		.from("plan_ownership")
		.select("plan_id")
		.eq("plan_id", planId)
		.eq("user_id", user.id)
		.maybeSingle();

	if (ownershipError) {
		throw new Error(
			`Failed to verify plan ownership: ${ownershipError.message}`,
		);
	}

	if (!ownership) {
		error(404, "Nie znaleziono planu.");
	}

	const body = await request.json();
	const parsed = planUpdateSchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? "Nieprawidłowe dane");
	}

	const { error: updateError } = await getSupabase()
		.from("plan")
		.update({ name: parsed.data.name })
		.eq("id", planId);

	if (updateError) {
		throw new Error(`Failed to update plan: ${updateError.message}`);
	}

	return json({ ok: true });
};
