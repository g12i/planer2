import { error, json } from "@sveltejs/kit";
import { v7 as uuidv7 } from "uuid";
import {
	planDetailSubjectGroupSchema,
	subjectGroupsUpdateResponseSchema,
	subjectGroupsUpdateSchema,
} from "$lib/plan-schemas";
import { requireUser } from "$lib/server/auth";
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

async function requireSubjectInPlan(planId: string, subjectId: string) {
	const { data: subject, error: subjectError } = await getSupabase()
		.from("plan_semester_subject")
		.select("id, plan_semester_id")
		.eq("id", subjectId)
		.maybeSingle();

	if (subjectError) {
		throw new Error(`Failed to load subject: ${subjectError.message}`);
	}

	if (!subject) {
		error(404, "Nie znaleziono przedmiotu.");
	}

	const { data: semester, error: semesterError } = await getSupabase()
		.from("plan_semester")
		.select("id")
		.eq("id", subject.plan_semester_id)
		.eq("plan_id", planId)
		.maybeSingle();

	if (semesterError) {
		throw new Error(`Failed to load semester: ${semesterError.message}`);
	}

	if (!semester) {
		error(404, "Nie znaleziono przedmiotu.");
	}
}

export const PUT: RequestHandler = async ({
	params,
	request,
	cookies,
}) => {
	const user = await requireUser(cookies);
	const planId = params.id;
	const subjectId = params.subjectId;
	await requirePlanOwnership(planId, user.id);
	await requireSubjectInPlan(planId, subjectId);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, "Nieprawidłowe dane.");
	}

	const parsed = subjectGroupsUpdateSchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? "Nieprawidłowe dane.");
	}

	const groups = parsed.data;

	const { error: deleteError } = await getSupabase()
		.from("plan_semester_subject_group")
		.delete()
		.eq("plan_semester_subject_id", subjectId);

	if (deleteError) {
		throw new Error(`Failed to delete groups: ${deleteError.message}`);
	}

	const insertRows = groups.map((group) => ({
		id: uuidv7(),
		plan_semester_subject_id: subjectId,
		activity_kind: group.activity_kind,
		hours_total: group.hours_total,
		group_index: group.group_index,
		label: group.label,
		lecturer_usos_id: group.lecturer_usos_id,
		room_usos_id: group.room_usos_id,
	}));

	const { data: inserted, error: insertError } = await getSupabase()
		.from("plan_semester_subject_group")
		.insert(insertRows)
		.select(
			"id, activity_kind, hours_total, group_index, label, lecturer_usos_id, room_usos_id",
		)
		.order("activity_kind")
		.order("group_index");

	if (insertError) {
		throw new Error(`Failed to insert groups: ${insertError.message}`);
	}

	const response = inserted.map((row) =>
		planDetailSubjectGroupSchema.parse({
			id: row.id,
			activity_kind: row.activity_kind,
			hours_total: row.hours_total,
			group_index: row.group_index,
			label: row.label,
			lecturer_usos_id: row.lecturer_usos_id,
			room_usos_id: row.room_usos_id,
		}),
	);

	return json(subjectGroupsUpdateResponseSchema.parse(response));
};
