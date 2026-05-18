import { getSupabase } from "$lib/server/supabase";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async () => {
	const { data, error } = await getSupabase()
		.from("catalog_programme")
		.select("id, code, name, semester_count")
		.order("code");

	if (error) {
		throw new Error(`Failed to load programmes: ${error.message}`);
	}

	return { programmes: data };
};
