import { z } from "zod";

const usosTitlesSchema = z.looseObject({
  before: z.string().nullable().optional(),
  after: z.string().nullable().optional(),
});

const usosPhotoUrlsSchema = z.looseObject({
  "50x50": z.string().optional(),
});

export const usosSearchUserSchema = z.looseObject({
  id: z.string().min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  titles: usosTitlesSchema.optional(),
  photo_urls: usosPhotoUrlsSchema.optional(),
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
  "items[match|user[id|first_name|last_name|titles|photo_urls[50x50]]]";

/** `services/users/user` — single user by `user_id` query param. */
export const USOS_USER_FIELDS =
  "id|first_name|last_name|titles|photo_urls[50x50]";

export const usosUserSchema = z.looseObject({
  id: z.string().min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  titles: usosTitlesSchema.optional(),
  photo_urls: usosPhotoUrlsSchema.optional(),
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

export function getUsosPhotoUrl50(
  user: z.infer<typeof usosSearchUserSchema>,
): string | undefined {
  const url = user.photo_urls?.["50x50"]?.trim();
  return url || undefined;
}

export function getUsosUserInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const last = parts.at(-1) ?? "";
  return `${parts[0][0]}${last[0] ?? ""}`.toUpperCase();
}

export function usosSearchItemToOption(
  item: z.infer<typeof usosSearchItemSchema>,
) {
  const { user } = item;
  const label = formatUsosUserDisplayName(user);

  return {
    value: user.id,
    label,
    storedName: formatUsosUserStoredName(user),
    subtitle: formatUsosUserSubtitle(user),
    photoUrl: getUsosPhotoUrl50(user),
  };
}
