import { isRedirect, redirect } from "@sveltejs/kit";
import { AccessDeniedError } from "$lib/server/access-guard";
import { completeUsosOAuth } from "$lib/server/auth";
import {
  getOAuthStateCookieDeleteOptions,
  getOAuthStateCookieName,
  getSessionCookieName,
  getSessionCookieOptions,
} from "$lib/server/session";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, cookies }) => {
  const oauthToken = url.searchParams.get("oauth_token")?.trim() ?? "";
  const oauthVerifier = url.searchParams.get("oauth_verifier")?.trim() ?? "";
  const oauthState = cookies.get(getOAuthStateCookieName())?.trim() ?? "";

  cookies.delete(getOAuthStateCookieName(), getOAuthStateCookieDeleteOptions());

  if (!oauthToken || !oauthVerifier) {
    redirect(303, "/login?error=missing_oauth_params");
  }

  try {
    const { sessionId } = await completeUsosOAuth({
      oauthToken,
      oauthVerifier,
      oauthState,
    });

    cookies.set(getSessionCookieName(), sessionId, getSessionCookieOptions());
    redirect(303, "/");
  } catch (error) {
    if (isRedirect(error)) {
      throw error;
    }
    if (error instanceof AccessDeniedError) {
      redirect(303, "/login?error=access_denied");
    }
    console.error("USOS OAuth callback failed:", error);
    redirect(303, "/login?error=oauth_failed");
  }
};
