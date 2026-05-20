import { error, json } from "@sveltejs/kit";
import { v7 as uuidv7 } from "uuid";
import {
	dayLayoutDeleteSchema,
	dayLayoutSchema,
	dayLayoutUpsertSchema,
} from "$lib/plan-schemas";
import { requireUser } from "$lib/server/auth";
import { parseDaySlots } from "$lib/server/planner-schemas";
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

async function requireSemesterInPlan(
	planId: string,
	planSemesterId: string,
) {
	const { data: semester, error: semesterError } = await getSupabase()
		.from("plan_semester")
		.select("id")
		.eq("id", planSemesterId)
		.eq("plan_id", planId)
		.maybeSingle();

	if (semesterError) {
		throw new Error(`Failed to load semester: ${semesterError.message}`);
	}

	if (!semester) {
		error(404, "Nie znaleziono semestru.");
	}
}

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

	const parsed = dayLayoutUpsertSchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? "Nieprawidłowe dane.");
	}

	const { plan_semester_id, date, slots } = parsed.data;
	await requireSemesterInPlan(planId, plan_semester_id);

	const slotsParsed = parseDaySlots(slots);
	if (!slotsParsed.success) {
		error(400, "Nieprawidłowe przedziały godzin.");
	}

	const { data: existing, error: existingError } = await getSupabase()
		.from("plan_semester_day_layout")
		.select("id")
		.eq("plan_semester_id", plan_semester_id)
		.eq("date", date)
		.maybeSingle();

	if (existingError) {
		throw new Error(
			`Failed to load day layout: ${existingError.message}`,
		);
	}

	const rowId = existing?.id ?? uuidv7();

	const { data: upserted, error: upsertError } = await getSupabase()
		.from("plan_semester_day_layout")
		.upsert(
			{
				id: rowId,
				plan_semester_id,
				date,
				slots: slotsParsed.data,
			},
			{ onConflict: "plan_semester_id,date" },
		)
		.select("id, plan_semester_id, date, slots")
		.single();

	if (upsertError) {
		throw new Error(`Failed to save day layout: ${upsertError.message}`);
	}

	const validatedSlots = parseDaySlots(upserted.slots);
	if (!validatedSlots.success) {
		throw new Error(
			`Invalid day layout slots after save: ${validatedSlots.error.message}`,
		);
	}

	return json(
		dayLayoutSchema.parse({
			id: upserted.id,
			date: upserted.date,
			plan_semester_id: upserted.plan_semester_id,
			slots: validatedSlots.data,
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

	const parsed = dayLayoutDeleteSchema.safeParse(body);
	if (!parsed.success) {
		error(400, parsed.error.issues[0]?.message ?? "Nieprawidłowe dane.");
	}

	const { plan_semester_id, date } = parsed.data;
	await requireSemesterInPlan(planId, plan_semester_id);

	const { error: deleteError } = await getSupabase()
		.from("plan_semester_day_layout")
		.delete()
		.eq("plan_semester_id", plan_semester_id)
		.eq("date", date);

	if (deleteError) {
		throw new Error(`Failed to delete day layout: ${deleteError.message}`);
	}

	return new Response(null, { status: 204 });
};
