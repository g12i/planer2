import { redirect } from "@sveltejs/kit";
import { deleteSession, parseSessionId } from "$lib/server/auth";
import {
	getSessionCookieDeleteOptions,
	getSessionCookieName,
} from "$lib/server/session";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ cookies }) => {
		const sessionId = parseSessionId(cookies.get(getSessionCookieName()));
		if (sessionId) {
			await deleteSession(sessionId);
		}

		cookies.delete(getSessionCookieName(), getSessionCookieDeleteOptions());
		redirect(303, "/login");
	},
};
