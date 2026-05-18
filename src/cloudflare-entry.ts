/**
 * Cloudflare Worker entry (deploy via wrangler.deploy.toml).
 * Wraps the SvelteKit-generated worker and adds cron handlers.
 */

import { syncCatalog } from "$lib/server/catalog-sync.js";
import skWorker from "../.svelte-kit/cloudflare/_worker.js";

export default {
  fetch(request: Request, env: unknown, ctx: unknown) {
    return skWorker.fetch(request, env, ctx);
  },
  scheduled(
    _controller: unknown,
    _env: unknown,
    ctx: { waitUntil(promise: Promise<unknown>): void },
  ) {
    ctx.waitUntil(
      syncCatalog().catch((error) => {
        console.error(
          "[catalog-sync] scheduled run failed:",
          error instanceof Error ? error.message : error,
        );
      }),
    );
  },
};
