import { randomBytes, timingSafeEqual } from "node:crypto";
import type { z } from "zod";
import { AccessDeniedError, assertUserAccess } from "$lib/server/access-guard";
import {
	authUserSchema,
	oauthPendingRecordSchema,
	sessionRecordSchema,
	usosStoredTokensSchema,
} from "$lib/server/auth-schemas";
import type {
	AuthUser,
	OAuthPendingRecord,
	UsosStoredTokens,
} from "$lib/server/auth-types";
import { decryptToJson, encryptJson } from "$lib/server/crypto";
import { getRedis } from "$lib/server/redis";
import { deleteUser, resolveUser } from "$lib/server/users";
import {
	fetchUsosAccessToken,
	fetchUsosCurrentUser,
} from "$lib/server/usos-oauth";
import type { UsosOAuthTokens } from "$lib/server/usos-types";

export { createUserId } from "$lib/server/users";
export type { AuthUser };
export { AccessDeniedError };

const SESSION_TTL_SEC = 60 * 60 * 24 * 7;
const OAUTH_PENDING_TTL_SEC = 60 * 30;
/** 32 random bytes as base64url (no padding). */
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function createSessionId(): string {
	return randomBytes(32).toString("base64url");
}

export function createOAuthState(): string {
	return randomBytes(16).toString("base64url");
}

export function parseSessionId(value: string | undefined): string | null {
	const trimmed = value?.trim();
	if (!trimmed || !SESSION_ID_PATTERN.test(trimmed)) {
		return null;
	}
	return trimmed;
}

function safeEqualString(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}
	return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function saveOAuthPending(
	oauthToken: string,
	record: OAuthPendingRecord,
): Promise<void> {
	const redis = getRedis();
	await redis.set(`oauth:pending:${oauthToken}`, record, {
		ex: OAUTH_PENDING_TTL_SEC,
	});
}

export async function getOAuthPending(
	oauthToken: string,
): Promise<OAuthPendingRecord | null> {
	const redis = getRedis();
	const raw = await redis.get(`oauth:pending:${oauthToken}`);
	return readRedis(oauthPendingRecordSchema, raw, "oauth:pending");
}

export async function deleteOAuthPending(oauthToken: string): Promise<void> {
	const redis = getRedis();
	await redis.del(`oauth:pending:${oauthToken}`);
}

export async function createSession(user: AuthUser): Promise<string> {
	const redis = getRedis();
	const sessionId = createSessionId();
	const record = sessionRecordSchema.parse({
		userId: user.id,
		usosUserId: user.usosUserId,
		displayName: user.displayName,
	});
	await redis.set(`session:${sessionId}`, record, { ex: SESSION_TTL_SEC });
	return sessionId;
}

export async function getSessionUserId(
	sessionId: string,
): Promise<string | null> {
	const id = parseSessionId(sessionId);
	if (!id) {
		return null;
	}

	const redis = getRedis();
	const raw = await redis.get(`session:${id}`);
	const record = readRedis(sessionRecordSchema, raw, "session");
	return record?.userId ?? null;
}

export async function deleteSession(sessionId: string): Promise<void> {
	const id = parseSessionId(sessionId);
	if (!id) {
		return;
	}

	const redis = getRedis();
	await redis.del(`session:${id}`);
}

export async function saveUsosTokens(
	userId: string,
	tokens: UsosStoredTokens,
): Promise<void> {
	const parsed = usosStoredTokensSchema.parse(tokens);
	const redis = getRedis();
	const encrypted = encryptJson(parsed);
	await redis.set(`usos:tokens:${userId}`, encrypted);
}

export async function getUsosTokens(
	userId: string,
): Promise<UsosStoredTokens | null> {
	const redis = getRedis();
	const encrypted = await redis.get(`usos:tokens:${userId}`);
	if (!encrypted || typeof encrypted !== "string") {
		return null;
	}

	const json = decryptToJson(encrypted);
	return readRedis(usosStoredTokensSchema, json, "usos:tokens");
}

export async function getSessionUser(
	sessionId: string,
): Promise<AuthUser | null> {
	const id = parseSessionId(sessionId);
	if (!id) {
		return null;
	}

	const redis = getRedis();
	const raw = await redis.get(`session:${id}`);
	const record = readRedis(sessionRecordSchema, raw, "session");
	if (!record) {
		return null;
	}

	return authUserSchema.parse({
		id: record.userId,
		usosUserId: record.usosUserId,
		displayName: record.displayName,
	});
}

async function rollbackLoginArtifacts(params: {
	userId: string;
	isNewUser: boolean;
}): Promise<void> {
	const redis = getRedis();
	await redis.del(`usos:tokens:${params.userId}`);

	if (params.isNewUser) {
		await deleteUser(params.userId);
	}
}

export async function completeUsosOAuth(params: {
	oauthToken: string;
	oauthVerifier: string;
	oauthState: string;
}): Promise<{ user: AuthUser; sessionId: string }> {
	const oauthToken = params.oauthToken.trim();
	const oauthVerifier = params.oauthVerifier.trim();
	const oauthState = params.oauthState.trim();

	if (!oauthToken || !oauthVerifier || !oauthState) {
		throw new Error("Missing OAuth token, verifier, or state.");
	}

	const pending = await getOAuthPending(oauthToken);

	if (!pending) {
		throw new Error(
			"OAuth session expired or invalid. Please try logging in again.",
		);
	}

	if (!safeEqualString(oauthState, pending.state)) {
		throw new Error("OAuth state mismatch.");
	}

	const tokens: UsosOAuthTokens = await fetchUsosAccessToken(
		oauthToken,
		pending.requestTokenSecret,
		oauthVerifier,
	);

	const profile = await fetchUsosCurrentUser(tokens);

	assertUserAccess(profile);

	const storedTokens = usosStoredTokensSchema.parse({
		...tokens,
		expiresAt: null,
	});

	const displayName =
		[profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
		profile.id;

	const { user: dbUser, isNewUser } = await resolveUser(profile.id);

	const user = authUserSchema.parse({
		id: dbUser.id,
		usosUserId: dbUser.usosUserId,
		displayName,
	});

	try {
		await saveUsosTokens(user.id, storedTokens);
		await deleteOAuthPending(oauthToken);
		const sessionId = await createSession(user);
		return { user, sessionId };
	} catch (error) {
		await rollbackLoginArtifacts({
			userId: user.id,
			isNewUser,
		});
		throw error;
	}
}

function readRedis<T>(
	schema: z.ZodType<T>,
	value: unknown,
	label: string,
): T | null {
	if (value === null || value === undefined) {
		return null;
	}

	const result = schema.safeParse(value);

	if (!result.success) {
		console.warn(`${label}: invalid stored data`, result.error);
		return null;
	}

	return result.data;
}
