import { error, json } from "@sveltejs/kit";
import {
	planSharingAddSchema,
	planSharingListSchema,
	planSharingMemberSchema,
	planSharingRemoveSchema,
} from "$lib/plan-sharing-schemas";
import { requireUser } from "$lib/server/auth";
import { getSupabase } from "$lib/server/supabase";
import { resolveUser } from "$lib/server/users";
import type { RequestHandler } from "./$types";

function usosUserIdFromJoin(
	users: { usos_user_id: string } | { usos_user_id: string }[],
): string {
	if (Array.isArray(users)) {
		const row = users[0];
		if (!row) {
			throw new Error("Missing joined user row");
		}
		return row.usos_user_id;
	}
	return users.usos_user_id;
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

export const GET: RequestHandler = async ({ params, cookies }) => {
	const user = await requireUser(cookies);
	const planId = params.id;

	await requirePlanOwnership(planId, user.id);

	const { data: rows, error: listError } = await getSupabase()
		.from("plan_ownership")
		.select("user_id, role, created_at, users!inner(usos_user_id)")
		.eq("plan_id", planId)
		.order("created_at", { ascending: true });

	if (listError) {
		throw new Error(`Failed to list plan sharing: ${listError.message}`);
	}

	const members = (rows ?? []).map((row) =>
		planSharingMemberSchema.parse({
			user_id: row.user_id,
			usos_user_id: usosUserIdFromJoin(row.users),
			role: row.role,
			created_at: row.created_at,
		}),
	);

	return json(planSharingListSchema.parse({ members }));
};

export const POST: RequestHandler = async ({ params, cookies, request }) => {
	const user = await requireUser(cookies);
	const planId = params.id;

	await requirePlanOwnership(planId, user.id);

	const body = planSharingAddSchema.safeParse(await request.json());
	if (!body.success) {
		return json({ error: "Nieprawidłowe dane." }, { status: 400 });
	}

	const { user: targetUser } = await resolveUser(body.data.usos_user_id);

	if (targetUser.id === user.id) {
		return json({ ok: true });
	}

	const { error: insertError } = await getSupabase()
		.from("plan_ownership")
		.insert({
			plan_id: planId,
			user_id: targetUser.id,
			role: "editor",
		});

	if (insertError?.code === "23505") {
		return json({ ok: true });
	}

	if (insertError) {
		return json(
			{ error: `Nie udało się udostępnić planu: ${insertError.message}` },
			{ status: 500 },
		);
	}

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params, cookies, request }) => {
	const user = await requireUser(cookies);
	const planId = params.id;

	await requirePlanOwnership(planId, user.id);

	const body = planSharingRemoveSchema.safeParse(await request.json());
	if (!body.success) {
		return json({ error: "Nieprawidłowe dane." }, { status: 400 });
	}

	const { data: target, error: targetError } = await getSupabase()
		.from("plan_ownership")
		.select("role")
		.eq("plan_id", planId)
		.eq("user_id", body.data.user_id)
		.maybeSingle();

	if (targetError) {
		throw new Error(`Failed to load ownership row: ${targetError.message}`);
	}

	if (!target) {
		return json({ ok: true });
	}

	if (target.role === "owner") {
		return json(
			{ error: "Nie można usunąć właściciela planu." },
			{ status: 400 },
		);
	}

	const { error: deleteError } = await getSupabase()
		.from("plan_ownership")
		.delete()
		.eq("plan_id", planId)
		.eq("user_id", body.data.user_id);

	if (deleteError) {
		return json(
			{ error: `Nie udało się cofnąć udostępnienia: ${deleteError.message}` },
			{ status: 500 },
		);
	}

	return json({ ok: true });
};
