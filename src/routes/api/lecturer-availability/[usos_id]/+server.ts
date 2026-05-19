import { json } from "@sveltejs/kit";
import {
	dayArraysToPreferences,
	lecturerAvailabilityFormSchema,
	preferencesToDayArrays,
	preferencesToSlotArrays,
	slotArraysToPreferences,
} from "$lib/lecturer-availability-schemas";
import type { LecturerAvailabilityForm } from "$lib/lecturer-availability-types";
import { getSupabase } from "$lib/server/supabase";
import type { Tables } from "$lib/server/database-types";
import type { RequestHandler } from "./$types";

const ROW_COLUMNS =
	"usos_id, name, preferred_days, preferred_slots, unavailable_dates, unavailable_days, unavailable_slots, notes" as const;

type LecturerRow = Pick<
	Tables<"lecturer_availability">,
	| "usos_id"
	| "name"
	| "preferred_days"
	| "preferred_slots"
	| "unavailable_dates"
	| "unavailable_days"
	| "unavailable_slots"
	| "notes"
>;

function rowToForm(row: LecturerRow): LecturerAvailabilityForm {
	return {
		usos_id: row.usos_id,
		name: row.name,
		...dayArraysToPreferences(row.preferred_days, row.unavailable_days),
		...slotArraysToPreferences(row.preferred_slots, row.unavailable_slots),
		unavailable_dates: row.unavailable_dates,
		notes: row.notes,
	};
}

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

export const GET: RequestHandler = async ({ params }) => {
	const { data, error } = await getSupabase()
		.from("lecturer_availability")
		.select(ROW_COLUMNS)
		.eq("usos_id", params.usos_id)
		.maybeSingle();

	if (error) {
		throw new Error(`Failed to load lecturer availability: ${error.message}`);
	}

	if (!data) {
		return json(
			{ error: "Nie znaleziono dostępności prowadzącego." },
			{ status: 404 },
		);
	}

	return json(rowToForm(data));
};

export const PATCH: RequestHandler = async ({ request, params }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: "Nieprawidłowe dane JSON." }, { status: 400 });
	}

	const parsed = lecturerAvailabilityFormSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: "Nieprawidłowe dane formularza." }, { status: 400 });
	}

	if (parsed.data.usos_id !== params.usos_id) {
		return json(
			{ error: "Nie można zmienić identyfikatora prowadzącego." },
			{ status: 400 },
		);
	}

	const { error } = await getSupabase()
		.from("lecturer_availability")
		.upsert(formToUpsertRow(parsed.data), { onConflict: "usos_id" });

	if (error) {
		return json(
			{ error: `Nie udało się zapisać: ${error.message}` },
			{ status: 500 },
		);
	}

	return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { error } = await getSupabase()
		.from("lecturer_availability")
		.delete()
		.eq("usos_id", params.usos_id);

	if (error) {
		return json(
			{ error: `Nie udało się usunąć: ${error.message}` },
			{ status: 500 },
		);
	}

	return new Response(null, { status: 204 });
};
