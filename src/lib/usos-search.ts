import {
	USOS_SEARCH2_FIELDS,
	usosSearch2ResponseSchema,
	usosSearchItemToOption,
} from "$lib/usos-users-schemas";
import type { UsosUserSearchOption } from "$lib/usos-users-types";

export async function searchUsosStaff(
	query: string,
): Promise<UsosUserSearchOption[]> {
	const trimmed = query.trim();
	if (trimmed.length < 2) {
		return [];
	}

	const params = new URLSearchParams({
		lang: "pl",
		format: "json",
		query: trimmed,
		among: "current_teachers",
		num: "20",
		fields: USOS_SEARCH2_FIELDS,
	});

	const res = await fetch(`/api/usos/users/search2?${params.toString()}`);

	if (!res.ok) {
		throw new Error(`USOS search failed (${res.status})`);
	}

	const json: unknown = await res.json();
	const parsed = usosSearch2ResponseSchema.safeParse(json);
	if (!parsed.success) {
		throw new Error("USOS search returned invalid data");
	}

	return parsed.data.items.map(usosSearchItemToOption);
}
