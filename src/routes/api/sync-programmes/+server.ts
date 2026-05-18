import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { syncCatalog } from "$lib/server/catalog-sync";
import type { RequestHandler } from "./$types";

function isAuthorized(request: Request): boolean {
	const syncSecret = env.SYNC_SECRET;
	if (!syncSecret) {
		return false;
	}
	const header = request.headers.get("authorization");
	return header === `Bearer ${syncSecret}`;
}

export const POST: RequestHandler = async ({ request }) => {
	if (!isAuthorized(request)) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	syncCatalog().catch((error) => {
		console.error("[sync-programmes] catalog sync failed", error);
	});

	return json({ message: "Catalog sync started" });
};
