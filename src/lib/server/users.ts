import { v7 as uuidv7 } from "uuid";
import { z } from "zod";
import { userIdSchema } from "$lib/server/auth-schemas";
import { getSupabase } from "$lib/server/supabase";

const USER_COLUMNS = "id, usos_user_id" as const;

const dbUserSchema = z.object({
  id: userIdSchema,
  usosUserId: z.string().min(1),
});

export type DbUser = z.infer<typeof dbUserSchema>;

/** Time-ordered app user pk (Postgres-friendly). */
export function createUserId(): string {
  return uuidv7();
}

function rowToDbUser(row: { id: string; usos_user_id: string }): DbUser {
  return dbUserSchema.parse({
    id: row.id,
    usosUserId: row.usos_user_id,
  });
}

async function findUserByUsosId(usosUserId: string): Promise<DbUser | null> {
  const { data, error } = await getSupabase()
    .from("users")
    .select(USER_COLUMNS)
    .eq("usos_user_id", usosUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find user: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return rowToDbUser(data);
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await getSupabase().from("users").delete().eq("id", userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

export async function resolveUser(
  usosUserId: string,
): Promise<{ user: DbUser; isNewUser: boolean }> {
  const existing = await findUserByUsosId(usosUserId);

  if (existing) {
    return { user: existing, isNewUser: false };
  }

  const id = createUserId();

  const { error } = await getSupabase().from("users").insert({
    id,
    usos_user_id: usosUserId,
  });

  if (error?.code === "23505") {
    const winner = await findUserByUsosId(usosUserId);
    if (!winner) {
      throw new Error("Failed to resolve user after USOS login.");
    }
    return { user: winner, isNewUser: false };
  }

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return {
    user: dbUserSchema.parse({ id, usosUserId }),
    isNewUser: true,
  };
}
