import type { z } from "zod";
import type {
	authUserSchema,
	oauthPendingRecordSchema,
	sessionRecordSchema,
	usosStoredTokensSchema,
} from "$lib/server/auth-schemas";

export type AuthUser = z.infer<typeof authUserSchema>;
export type UsosStoredTokens = z.infer<typeof usosStoredTokensSchema>;
export type SessionRecord = z.infer<typeof sessionRecordSchema>;
export type OAuthPendingRecord = z.infer<typeof oauthPendingRecordSchema>;
