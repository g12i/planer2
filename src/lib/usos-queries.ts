import { queryOptions } from "@tanstack/svelte-query";
import { http } from "$lib/http";
import {
	geoBuilding2WithRoomsSchema,
	geoBuildingIndexSchema,
	geoRoomDetailSchema,
	USOS_BUILDING_INDEX_FIELDS,
	USOS_BUILDING2_ROOMS_FIELDS,
	USOS_ROOM_FIELDS,
} from "$lib/usos-geo-schemas";
import {
	USOS_SEARCH2_FIELDS,
	USOS_USER_FIELDS,
	usosSearch2ResponseSchema,
	usosSearchItemToOption,
	usosUserSchema,
} from "$lib/usos-users-schemas";
import type { UsosSearchAmong } from "$lib/usos-users-types";

export const usosQueries = {
	staffSearch: (query: string, among: UsosSearchAmong = "current_teachers") =>
		queryOptions({
			queryKey: ["usos", "staff-search", among, query] as const,
			queryFn: async () => {
				const trimmed = query.trim();
				if (trimmed.length < 2) {
					return [];
				}

				const params = new URLSearchParams({
					lang: "pl",
					format: "json",
					query: trimmed,
					among,
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
			queryKey: ["usos", "user", userId, "profile"] as const,
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

	buildingIndex: () =>
		queryOptions({
			queryKey: ["usos", "geo", "buildings"] as const,
			staleTime: 1000 * 60 * 60 * 24,
			gcTime: 1000 * 60 * 60 * 48,
			queryFn: () => {
				const params = new URLSearchParams({
					langpref: "pl",
					format: "json",
					fields: USOS_BUILDING_INDEX_FIELDS,
				});

				return http({
					method: "GET",
					url: `/api/usos/geo/building_index?${params.toString()}`,
					schema: geoBuildingIndexSchema,
				});
			},
		}),

	buildingRooms: (buildingId: string) =>
		queryOptions({
			queryKey: ["usos", "geo", "buildings", buildingId, "rooms"] as const,
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24,
			enabled: Boolean(buildingId),
			queryFn: () => {
				const params = new URLSearchParams({
					building_id: buildingId,
					langpref: "pl",
					format: "json",
					fields: USOS_BUILDING2_ROOMS_FIELDS,
				});

				return http({
					method: "GET",
					url: `/api/usos/geo/building2?${params.toString()}`,
					schema: geoBuilding2WithRoomsSchema,
				});
			},
		}),

	room: (roomId: string) =>
		queryOptions({
			queryKey: ["usos", "geo", "rooms", roomId] as const,
			staleTime: 1000 * 60 * 60 * 24,
			gcTime: 1000 * 60 * 60 * 48,
			enabled: Boolean(roomId),
			queryFn: () => {
				const params = new URLSearchParams({
					room_id: roomId,
					langpref: "pl",
					format: "json",
					fields: USOS_ROOM_FIELDS,
				});

				return http({
					method: "GET",
					url: `/api/usos/geo/room?${params.toString()}`,
					schema: geoRoomDetailSchema,
				});
			},
		}),
};
