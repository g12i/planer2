import { json } from "@sveltejs/kit";
import { getSupabase } from "$lib/server/supabase";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
	const { data, error } = await getSupabase()
		.from("catalog_programme")
		.select("id, code, name, semester_count")
		.order("name");

	if (error) {
		throw new Error(`Failed to load programmes: ${error.message}`);
	}

	return json(data);
};
