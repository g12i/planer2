import { z } from "zod";

const langDictSchema = z.object({
	pl: z.string().nullable(),
	en: z.string().nullable(),
});

export const geoBuildingSchema = z.object({
	id: z.string(),
	name: langDictSchema,
	postal_address: z.string().nullable(),
});

export const geoBuildingIndexSchema = z.array(geoBuildingSchema);

export const geoRoomSchema = z.object({
	id: z.string(),
	number: z.string(),
	capacity: z.number().nullable(),
	type: z.string().nullable(),
});

export const geoBuilding2WithRoomsSchema = z.object({
	id: z.string(),
	name: langDictSchema,
	rooms: z.array(geoRoomSchema),
});

export const geoRoomDetailSchema = z.object({
	id: z.string(),
	number: z.string(),
});

export const USOS_BUILDING_INDEX_FIELDS = "id|name|postal_address";
export const USOS_BUILDING2_ROOMS_FIELDS =
	"id|name|rooms[id|number|capacity|type]";
export const USOS_ROOM_FIELDS = "id|number";

export function formatGeoBuildingLabel(
	building: z.infer<typeof geoBuildingSchema>,
): string {
	const name = building.name.pl?.trim() || building.name.en?.trim();
	if (name && building.postal_address) {
		return `${name} (${building.postal_address})`;
	}
	return name || building.postal_address || building.id;
}

export function geoBuildingToOption(building: z.infer<typeof geoBuildingSchema>) {
	return {
		value: building.id,
		label: formatGeoBuildingLabel(building),
	};
}

export function geoRoomToOption(room: z.infer<typeof geoRoomSchema>) {
	const capacity =
		room.capacity !== null ? `Pojemność: ${room.capacity}` : null;
	return {
		value: room.id,
		label: room.number,
		subtitle: capacity,
	};
}
