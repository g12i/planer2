import { syncCatalog } from "$lib/server/catalog-sync";

export async function runScheduledCatalogSync(): Promise<void> {
	const summary = await syncCatalog();
	console.log("[catalog-sync]", JSON.stringify(summary));

	if (summary.errors.length > 0) {
		console.error("[catalog-sync] errors:", summary.errors.join("; "));
	}
}
