import { z } from "zod";
import { usosOAuthTokensSchema } from "$lib/server/usos-schemas";

export const userIdSchema = z.uuid();

export const authUserSchema = z.object({
	id: userIdSchema,
	usosUserId: z.string().min(1),
	displayName: z.string(),
});

export const usosStoredTokensSchema = usosOAuthTokensSchema.extend({
	expiresAt: z.string().nullable(),
});

export const sessionRecordSchema = z.object({
	userId: userIdSchema,
});

export const oauthPendingRecordSchema = z.object({
	requestTokenSecret: z.string().min(1),
	state: z.string().min(16),
});

export const redisUserIdSchema = userIdSchema;
