import { json } from "@sveltejs/kit";
import {
	lecturerAvailabilityCreateSchema,
	lecturerAvailabilityFormFromCreate,
	preferencesToDayArrays,
	preferencesToSlotArrays,
} from "$lib/lecturer-availability-schemas";
import type {
	LecturerAvailabilityCreateResponse,
	LecturerAvailabilityForm,
} from "$lib/lecturer-availability-types";
import { getSupabase } from "$lib/server/supabase";
import type { RequestHandler } from "./$types";

function formToUpsertRow(form: LecturerAvailabilityForm) {
	const { preferred_days, unavailable_days } = preferencesToDayArrays({
		day_saturday: form.day_saturday,
		day_sunday: form.day_sunday,
	});
	const { preferred_slots, unavailable_slots } = preferencesToSlotArrays({
		slot_morning: form.slot_morning,
		slot_afternoon: form.slot_afternoon,
	});

	return {
		usos_id: form.usos_id,
		name: form.name,
		preferred_days,
		unavailable_days,
		preferred_slots,
		unavailable_slots,
		unavailable_dates: form.unavailable_dates,
		notes: form.notes,
		updated_at: new Date().toISOString(),
	};
}

export const GET: RequestHandler = async () => {
	const { data, error } = await getSupabase()
		.from("lecturer_availability")
		.select("usos_id, name")
		.order("name");

	if (error) {
		throw new Error(`Failed to load lecturer availability: ${error.message}`);
	}

	return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: "Nieprawidłowe dane JSON." }, { status: 400 });
	}

	const parsed = lecturerAvailabilityCreateSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: "Nieprawidłowe dane formularza." }, { status: 400 });
	}

	const { data: existing } = await getSupabase()
		.from("lecturer_availability")
		.select("usos_id")
		.eq("usos_id", parsed.data.usos_id)
		.maybeSingle();

	if (existing) {
		return json(
			{ error: "Dostępność tego prowadzącego już istnieje." },
			{ status: 409 },
		);
	}

	const { error } = await getSupabase()
		.from("lecturer_availability")
		.upsert(
			formToUpsertRow(lecturerAvailabilityFormFromCreate(parsed.data)),
			{ onConflict: "usos_id" },
		);

	if (error) {
		return json(
			{ error: `Nie udało się utworzyć: ${error.message}` },
			{ status: 500 },
		);
	}

	return json(
		{ usos_id: parsed.data.usos_id } satisfies LecturerAvailabilityCreateResponse,
		{ status: 201 },
	);
};
