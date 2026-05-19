import { error } from "@sveltejs/kit";
import {
  getSessionUser,
  getUsosTokens,
  parseSessionId,
} from "$lib/server/auth";
import { getSessionCookieName } from "$lib/server/session";
import { usosSignedFetch } from "$lib/server/usos-oauth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, url, cookies }) => {
  const sessionId = parseSessionId(cookies.get(getSessionCookieName()));
  if (!sessionId) {
    error(401, "Unauthorized");
  }

  const user = await getSessionUser(sessionId);
  if (!user) {
    error(401, "Unauthorized");
  }

  const storedTokens = await getUsosTokens(user.id);
  if (!storedTokens) {
    error(401, "Missing USOS tokens");
  }

  const tokens = {
    accessToken: storedTokens.accessToken,
    accessTokenSecret: storedTokens.accessTokenSecret,
    scopes: storedTokens.scopes,
  };

  const pathParts = params.path;
  const segments = Array.isArray(pathParts) ? pathParts : [pathParts];
  const rest = segments.join("/").replace(/^\/?services\/?/, "");
  const usosPath = `/services/${rest}`;

  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const res = await usosSignedFetch(usosPath, tokens, { query });

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
};
