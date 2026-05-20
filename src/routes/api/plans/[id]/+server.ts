import { error, json } from "@sveltejs/kit";
import { planDetailSchema } from "$lib/plan-schemas";
import type { PlanDetail } from "$lib/plan-types";
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
		.select("id, name, programme_code, programme_name")
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

	const semesterIds = semesters.map((semester) => semester.id);
	const subjectsBySemesterId = new Map<
		string,
		{ id: string; module_code: string | null; module_name: string }[]
	>();

	if (semesterIds.length > 0) {
		const { data: subjects, error: subjectsError } = await getSupabase()
			.from("plan_semester_subject")
			.select("id, plan_semester_id, module_code, module_name")
			.in("plan_semester_id", semesterIds)
			.order("module_name");

		if (subjectsError) {
			throw new Error(`Failed to load subjects: ${subjectsError.message}`);
		}

		for (const subject of subjects) {
			const list = subjectsBySemesterId.get(subject.plan_semester_id) ?? [];
			list.push({
				id: subject.id,
				module_code: subject.module_code,
				module_name: subject.module_name,
			});
			subjectsBySemesterId.set(subject.plan_semester_id, list);
		}
	}

	const response: PlanDetail = {
		id: plan.id,
		name: plan.name,
		programme_code: plan.programme_code,
		programme_name: plan.programme_name,
		semesters: semesters.map((semester) => ({
			id: semester.id,
			number: semester.number,
			start_date: semester.start_date,
			end_date: semester.end_date,
			subjects: subjectsBySemesterId.get(semester.id) ?? [],
		})),
	};

	return json(planDetailSchema.parse(response));
};
