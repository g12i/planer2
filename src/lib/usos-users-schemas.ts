import { z } from "zod";

const usosTitlesSchema = z.looseObject({
  before: z.string().nullable().optional(),
  after: z.string().nullable().optional(),
});

export const usosSearchUserSchema = z.looseObject({
  id: z.string().min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  titles: usosTitlesSchema.optional(),
});

export const usosSearchItemSchema = z.looseObject({
  match: z.string().optional(),
  user: usosSearchUserSchema,
});

export const usosSearch2ResponseSchema = z.looseObject({
  items: z.array(usosSearchItemSchema),
  next_page: z.boolean().optional(),
});

export const USOS_SEARCH2_FIELDS =
  "items[match|user[id|first_name|last_name|titles]]";

/** `services/users/user` — single user by `user_id` query param (no `titles` on this method). */
export const USOS_USER_FIELDS = "id|first_name|last_name";

export const usosUserSchema = z.looseObject({
  id: z.string().min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export function formatUsosUserDisplayName(
  user: z.infer<typeof usosSearchUserSchema>,
): string {
  const first = user.first_name?.trim() ?? "";
  const last = user.last_name?.trim() ?? "";

  return [first, last].filter(Boolean).join(" ") || user.id;
}

/** Full name with academic titles — persisted in lecturer_availability.name. */
export function formatUsosUserStoredName(
  user: z.infer<typeof usosSearchUserSchema>,
): string {
  const before = user.titles?.before?.trim();
  const after = user.titles?.after?.trim();
  const displayName = formatUsosUserDisplayName(user);

  return [before, displayName, after].filter(Boolean).join(" ") || user.id;
}

export function formatUsosUserSubtitle(
  user: z.infer<typeof usosSearchUserSchema>,
): string | null {
  const before = user.titles?.before?.trim();
  const after = user.titles?.after?.trim();
  const title = [before, after].filter(Boolean).join(" ");

  return title || null;
}

export function usosSearchItemToOption(
  item: z.infer<typeof usosSearchItemSchema>,
) {
  const { user } = item;

  return {
    value: user.id,
    label: formatUsosUserDisplayName(user),
    storedName: formatUsosUserStoredName(user),
    subtitle: formatUsosUserSubtitle(user),
  };
}
