import { error, json } from "@sveltejs/kit";
import { v7 as uuidv7 } from "uuid";
import {
	scheduleEntryCreateSchema,
	scheduleEntryDeleteSchema,
	scheduleEntrySchema,
	scheduleEntryUpdateSchema,
} from "$lib/plan-schemas";
import { getSessionUser, parseSessionId } from "$lib/server/auth";
import { getSessionCookieName } from "$lib/server/session";
import { getSupabase } from "$lib/server/supabase";
import type { RequestHandler } from "./$types";

async function requireUser(cookies: {
	get: (name: string) => string | undefined;
}) {
	const sessionId = parseSessionId(cookies.get(getSessionCookieName()));
	if (!sessionId) {
		error(401, "Unauthorized");
	}

	const user = await getSessionUser(sessionId);
	if (!user) {
		error(401, "Unauthorized");
	}

	return user;
}

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

async function requireGroupInPlan(planId: string, groupId: string) {
	const { data: group, error: groupError } = await getSupabase()
		.from("plan_semester_subject_group")
		.select("id, plan_semester_subject_id")
		.eq("id", groupId)
		.maybeSingle();

	if (groupError) {
		throw new Error(`Failed to load group: ${groupError.message}`);
	}

	if (!group) {
		error(404, "Nie znaleziono grupy.");
	}

	const { data: subject, error: subjectError } = await getSupabase()
		.from("plan_semester_subject")
		.select("id, plan_semester_id")
		.eq("id", group.plan_semester_subject_id)
		.maybeSingle();

	if (subjectError) {
		throw new Error(`Failed to load subject: ${subjectError.message}`);
	}

	if (!subject) {
		error(404, "Nie znaleziono grupy.");
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
		error(404, "Nie znaleziono grupy.");
	}
}

async function requireEntryInPlan(planId: string, entryId: string) {
	const { data: entry, error: entryError } = await getSupabase()
		.from("plan_schedule_entry")
		.select("id, plan_semester_subject_group_id")
		.eq("id", entryId)
		.maybeSingle();

	if (entryError) {
		throw new Error(`Failed to load schedule entry: ${entryError.message}`);
	}

	if (!entry) {
		error(404, "Nie znaleziono wpisu.");
	}

	await requireGroupInPlan(planId, entry.plan_semester_subject_group_id);
}

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const user = await requireUser(cookies);
	const planId = params.id;
	await requirePlanOwnership(planId, user.id);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, "Nieprawidłowe dane.");
	}

	const parsed = scheduleEntryCreateSchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? "Nieprawidłowe dane.");
	}

	const {
		plan_semester_subject_group_id,
		start_date_time,
		end_date_time,
	} = parsed.data;

	await requireGroupInPlan(planId, plan_semester_subject_group_id);

	const { data: inserted, error: insertError } = await getSupabase()
		.from("plan_schedule_entry")
		.insert({
			id: uuidv7(),
			plan_semester_subject_group_id,
			start_date_time,
			end_date_time,
		})
		.select(
			"id, plan_semester_subject_group_id, start_date_time, end_date_time, room_usos_id",
		)
		.single();

	if (insertError) {
		throw new Error(
			`Failed to create schedule entry: ${insertError.message}`,
		);
	}

	return json(
		scheduleEntrySchema.parse({
			id: inserted.id,
			plan_semester_subject_group_id:
				inserted.plan_semester_subject_group_id,
			start_date_time: inserted.start_date_time,
			end_date_time: inserted.end_date_time,
			room_usos_id: inserted.room_usos_id,
		}),
	);
};

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	const user = await requireUser(cookies);
	const planId = params.id;
	await requirePlanOwnership(planId, user.id);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, "Nieprawidłowe dane.");
	}

	const parsed = scheduleEntryUpdateSchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? "Nieprawidłowe dane.");
	}

	const { id, start_date_time, end_date_time } = parsed.data;
	await requireEntryInPlan(planId, id);

	const { data: updated, error: updateError } = await getSupabase()
		.from("plan_schedule_entry")
		.update({ start_date_time, end_date_time })
		.eq("id", id)
		.select(
			"id, plan_semester_subject_group_id, start_date_time, end_date_time, room_usos_id",
		)
		.single();

	if (updateError) {
		throw new Error(
			`Failed to update schedule entry: ${updateError.message}`,
		);
	}

	return json(
		scheduleEntrySchema.parse({
			id: updated.id,
			plan_semester_subject_group_id:
				updated.plan_semester_subject_group_id,
			start_date_time: updated.start_date_time,
			end_date_time: updated.end_date_time,
			room_usos_id: updated.room_usos_id,
		}),
	);
};

export const DELETE: RequestHandler = async ({ params, request, cookies }) => {
	const user = await requireUser(cookies);
	const planId = params.id;
	await requirePlanOwnership(planId, user.id);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, "Nieprawidłowe dane.");
	}

	const parsed = scheduleEntryDeleteSchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? "Nieprawidłowe dane.");
	}

	await requireEntryInPlan(planId, parsed.data.id);

	const { error: deleteError } = await getSupabase()
		.from("plan_schedule_entry")
		.delete()
		.eq("id", parsed.data.id);

	if (deleteError) {
		throw new Error(
			`Failed to delete schedule entry: ${deleteError.message}`,
		);
	}

	return new Response(null, { status: 204 });
};
