import { redirect } from "@sveltejs/kit";
import { createOAuthState, saveOAuthPending } from "$lib/server/auth";
import {
  getOAuthStateCookieName,
  getOAuthStateCookieOptions,
} from "$lib/server/session";
import {
  buildAuthorizeUrl,
  fetchUsosRequestToken,
} from "$lib/server/usos-oauth";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) {
    redirect(303, "/");
  }

  return {
    error: url.searchParams.get("error") ?? undefined,
  };
};

export const actions: Actions = {
  default: async ({ cookies }) => {
    const state = createOAuthState();
    const { oauthToken, oauthTokenSecret } = await fetchUsosRequestToken();
    await saveOAuthPending(oauthToken, {
      requestTokenSecret: oauthTokenSecret,
      state,
    });
    cookies.set(getOAuthStateCookieName(), state, getOAuthStateCookieOptions());
    const authorizeUrl = buildAuthorizeUrl(oauthToken);
    redirect(303, authorizeUrl);
  },
};
