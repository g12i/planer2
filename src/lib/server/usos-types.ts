import type { z } from "zod";
import type {
	oauthTokenParamsSchema,
	usosOAuthTokensSchema,
	usosRequestTokenSchema,
	usosSignedHttpMethodSchema,
	usosUserProfileSchema,
	usosUserResponseSchema,
} from "$lib/server/usos-schemas";

export type UsosUserResponse = z.infer<typeof usosUserResponseSchema>;
export type OAuthTokenParams = z.infer<typeof oauthTokenParamsSchema>;
export type UsosOAuthTokens = z.infer<typeof usosOAuthTokensSchema>;
export type UsosRequestToken = z.infer<typeof usosRequestTokenSchema>;
export type UsosUserProfile = z.infer<typeof usosUserProfileSchema>;
export type UsosSignedHttpMethod = z.infer<typeof usosSignedHttpMethodSchema>;
