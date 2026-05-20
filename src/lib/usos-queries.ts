import { queryOptions } from "@tanstack/svelte-query";
import { http } from "$lib/http";
import {
	USOS_SEARCH2_FIELDS,
	USOS_USER_FIELDS,
	usosSearch2ResponseSchema,
	usosSearchItemToOption,
	usosUserSchema,
} from "$lib/usos-users-schemas";

export const usosQueries = {
	staffSearch: (query: string) =>
		queryOptions({
			queryKey: ["usos", "staff-search", query] as const,
			queryFn: async () => {
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
			},
		}),

	user: (userId: string) =>
		queryOptions({
			queryKey: ["usos", "user", userId] as const,
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24,
			queryFn: () => {
				const params = new URLSearchParams({
					user_id: userId,
					lang: "pl",
					format: "json",
					fields: USOS_USER_FIELDS,
				});

				return http({
					method: "GET",
					url: `/api/usos/users/user?${params.toString()}`,
					schema: usosUserSchema,
				});
			},
		}),
};
