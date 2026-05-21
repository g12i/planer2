import { createClient } from "@supabase/supabase-js";
import { env } from "$env/dynamic/private";
import type { Database } from "$lib/server/database-types";
import { once } from "$lib/server/once";

export const getSupabase = once(() => {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
});
