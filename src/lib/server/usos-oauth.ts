import crypto from "node:crypto";
import OAuth from "oauth-1.0a";
import { env } from "$env/dynamic/private";
import { USOS_CONSUMER_KEY, USOS_CONSUMER_SECRET } from "$env/static/private";
import {
  oauthTokenParamsToAccessTokens,
  oauthTokenParamsToRequestToken,
  parseJsonBody,
  parseOAuthTokenParams,
  usosSignedHttpMethodSchema,
  usosUserResponseSchema,
  usosUserResponseToProfile,
} from "$lib/server/usos-oauth-schemas";
import type {
  UsosOAuthTokens,
  UsosRequestToken,
  UsosUserProfile,
} from "$lib/server/usos-oauth-types";

export const USOS_GEO_ORIGIN = "https://usosapps.us.edu.pl" as const;
/** `tt` is a service module, not an OAuth scope — timetable data uses `studies`. */
export const USOS_DEFAULT_SCOPES = "offline_access|studies" as const;
export const USOS_USER2_FIELDS =
  "id|first_name|last_name|student_number|staff_status" as const;

function getUsosBaseUrl(): string {
  return env.USOS_BASE_URL?.replace(/\/$/, "") ?? USOS_GEO_ORIGIN;
}

function getOrigin(): string {
  const origin = env.ORIGIN?.replace(/\/$/, "");
  if (!origin) {
    throw new Error("Missing ORIGIN");
  }
  return origin;
}

function createOAuthClient() {
  return new OAuth({
    consumer: {
      key: USOS_CONSUMER_KEY,
      secret: USOS_CONSUMER_SECRET,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });
}

export function getUsosOAuthUrls() {
  const base = getUsosBaseUrl();
  return {
    requestToken: `${base}/services/oauth/request_token`,
    authorize: `${base}/services/oauth/authorize`,
    accessToken: `${base}/services/oauth/access_token`,
  };
}

export function getUsosCallbackUrl(): string {
  return `${getOrigin()}/auth/usos/callback`;
}

function parseOAuthTokenResponse(body: string, label: string) {
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(body).entries()) {
    params[key] = value;
  }
  return parseOAuthTokenParams(params, label);
}

export async function fetchUsosRequestToken(
  scopes = USOS_DEFAULT_SCOPES,
): Promise<UsosRequestToken> {
  const oauth = createOAuthClient();
  const urls = getUsosOAuthUrls();
  const callback = getUsosCallbackUrl();

  const requestData = {
    url: `${urls.requestToken}?scopes=${encodeURIComponent(scopes)}&oauth_callback=${encodeURIComponent(callback)}`,
    method: "POST" as const,
  };

  const authHeader = oauth.toHeader(
    oauth.authorize(requestData, { key: "", secret: "" }),
  );
  const res = await fetch(requestData.url, {
    method: "POST",
    headers: {
      ...authHeader,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`USOS request_token failed (${res.status}): ${text}`);
  }

  const parsed = parseOAuthTokenResponse(
    await res.text(),
    "USOS request_token",
  );

  return oauthTokenParamsToRequestToken(parsed);
}

export function buildAuthorizeUrl(oauthToken: string): string {
  const urls = getUsosOAuthUrls();
  return `${urls.authorize}?oauth_token=${encodeURIComponent(oauthToken)}`;
}

export async function fetchUsosAccessToken(
  requestToken: string,
  requestTokenSecret: string,
  oauthVerifier: string,
): Promise<UsosOAuthTokens> {
  const verifier = oauthVerifier.trim();
  if (!verifier) {
    throw new Error("USOS access_token: missing oauth_verifier");
  }

  const oauth = createOAuthClient();
  const urls = getUsosOAuthUrls();

  const requestData = {
    url: `${urls.accessToken}?oauth_verifier=${encodeURIComponent(verifier)}`,
    method: "POST" as const,
  };

  const token = { key: requestToken, secret: requestTokenSecret };
  const authHeader = oauth.toHeader(oauth.authorize(requestData, token));
  const res = await fetch(requestData.url, {
    method: "POST",
    headers: {
      ...authHeader,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`USOS access_token failed (${res.status}): ${text}`);
  }

  const parsed = parseOAuthTokenResponse(await res.text(), "USOS access_token");

  return oauthTokenParamsToAccessTokens(parsed, USOS_DEFAULT_SCOPES);
}

export async function usosSignedFetch(
  path: string,
  tokens: UsosOAuthTokens,
  init?: RequestInit & { query?: Record<string, string> },
): Promise<Response> {
  const oauth = createOAuthClient();
  const base = getUsosBaseUrl();
  const query = init?.query ?? {};
  const pathUrl = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const search = new URLSearchParams(query).toString();
  const url = search ? `${pathUrl}?${search}` : pathUrl;

  const methodResult = usosSignedHttpMethodSchema.safeParse(
    (init?.method ?? "GET").toUpperCase(),
  );
  if (!methodResult.success) {
    throw new Error(
      `Unsupported HTTP method for USOS: ${init?.method ?? "GET"}`,
    );
  }
  const method = methodResult.data;

  // Query params must be in `data` for correct OAuth 1.0a signature (oauth-1.0a).
  const requestData = {
    url: pathUrl,
    method,
    ...(Object.keys(query).length > 0 ? { data: query } : {}),
  };

  const authHeader = oauth.toHeader(
    oauth.authorize(requestData, {
      key: tokens.accessToken,
      secret: tokens.accessTokenSecret,
    }),
  );

  return fetch(url, {
    ...init,
    method,
    headers: {
      Accept: "application/json",
      ...authHeader,
      ...init?.headers,
    },
  });
}

async function fetchUsosUserProfile(
  endpoint: "/services/users/user2" | "/services/users/user",
  fields: string,
  tokens: UsosOAuthTokens,
): Promise<UsosUserProfile> {
  const res = await usosSignedFetch(endpoint, tokens, {
    query: { fields, format: "json" },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`USOS ${endpoint} failed (${res.status}): ${text}`);
  }

  const user = parseJsonBody(usosUserResponseSchema, text, endpoint);
  return usosUserResponseToProfile(user);
}

export async function fetchUsosCurrentUser(
  tokens: UsosOAuthTokens,
): Promise<UsosUserProfile> {
  const fieldSets = [
    USOS_USER2_FIELDS,
    "id|first_name|last_name|staff_status",
    "id|first_name|last_name",
  ];

  for (const fields of fieldSets) {
    try {
      return await fetchUsosUserProfile(
        "/services/users/user2",
        fields,
        tokens,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isFieldError =
        message.includes("field_forbidden") ||
        message.includes("field forbidden");
      if (!isFieldError || fields === fieldSets.at(-1)) {
        console.warn(`USOS user2 fields=${fields} failed:`, message);
      }
    }
  }

  return fetchUsosUserProfile(
    "/services/users/user",
    USOS_USER2_FIELDS,
    tokens,
  );
}
