import { dev } from "$app/environment";

const ONE_WEEK = 60 * 60 * 24 * 7;
const OAUTH_STATE_MAX_AGE_SEC = 60 * 30;

/** `__Host-` requires Secure; use a plain name in local HTTP dev. */
export function getSessionCookieName(): string {
	return dev ? "planer-session" : "__Host-session";
}

function getSessionCookieBaseOptions() {
	return {
		path: "/",
		httpOnly: true,
		sameSite: "lax" as const,
		secure: !dev,
	};
}

export function getSessionCookieOptions() {
	return {
		...getSessionCookieBaseOptions(),
		maxAge: ONE_WEEK,
	};
}

/** Match set options so browsers actually clear `__Host-` cookies in prod. */
export function getSessionCookieDeleteOptions() {
	return getSessionCookieBaseOptions();
}

export function getOAuthStateCookieName(): string {
	return dev ? "planer-oauth-state" : "__Host-oauth-state";
}

export function getOAuthStateCookieOptions() {
	return {
		...getSessionCookieBaseOptions(),
		maxAge: OAUTH_STATE_MAX_AGE_SEC,
	};
}

export function getOAuthStateCookieDeleteOptions() {
	return getSessionCookieBaseOptions();
}
