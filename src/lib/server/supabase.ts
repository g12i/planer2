import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "$env/static/private";
import type { Database } from "$lib/server/database-types";
import { once } from "$lib/server/once";

export const getSupabase = once(() =>
	createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	}),
);
