import type { z } from "zod";
import type {
	geoBuilding2WithRoomsSchema,
	geoBuildingSchema,
	geoRoomDetailSchema,
	geoRoomSchema,
} from "$lib/usos-geo-schemas";

export type GeoBuilding = z.infer<typeof geoBuildingSchema>;
export type GeoRoom = z.infer<typeof geoRoomSchema>;
export type GeoBuilding2WithRooms = z.infer<typeof geoBuilding2WithRoomsSchema>;
export type GeoRoomDetail = z.infer<typeof geoRoomDetailSchema>;
