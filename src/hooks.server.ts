import { type Handle, redirect } from "@sveltejs/kit";
import { getSessionUser, parseSessionId } from "$lib/server/auth";
import { getSessionCookieName } from "$lib/server/session";

const PUBLIC_PATHS = ["/login", "/auth/usos/callback", "/api/sync-programmes"];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = parseSessionId(event.cookies.get(getSessionCookieName()));
	event.locals.user = sessionId ? await getSessionUser(sessionId) : null;

	const { pathname } = event.url;

	if (event.locals.user && pathname === "/login") {
		redirect(303, "/");
	}

	if (!event.locals.user && !isPublicPath(pathname)) {
		redirect(303, "/login");
	}

	return resolve(event);
};
