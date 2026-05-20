import { http } from "$lib/http";
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

	const data = await http({
		method: "GET",
		url: `/api/usos/users/search2?${params.toString()}`,
		schema: usosSearch2ResponseSchema,
	});

	return data.items.map(usosSearchItemToOption);
}
