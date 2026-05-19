import { z } from "zod";

function formatZodError(label: string, error: z.ZodError): string {
  const details = error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
  return `${label}: invalid data (${details})`;
}

/** USOS API error payload (JSON). */
export const usosApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

/** OAuth 1.0a token response (form-urlencoded, parsed to record). */
export const oauthTokenParamsSchema = z.object({
  oauth_token: z.string().min(1),
  oauth_token_secret: z.string().min(1),
  oauth_callback_confirmed: z.string().optional(),
});

/** services/users/user and user2 success payload (requested fields). */
export const usosUserResponseSchema = z.object({
  id: z.string().min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  student_number: z.string().nullable().optional(),
  staff_status: z.number().int().min(0).max(2).nullable().optional(),
});

/** Signed USOS API credentials (camelCase, app-internal). */
export const usosOAuthTokensSchema = z.object({
  accessToken: z.string().min(1),
  accessTokenSecret: z.string().min(1),
  scopes: z.string(),
});

/** OAuth 1.0a temporary request token (camelCase, app-internal). */
export const usosRequestTokenSchema = z.object({
  oauthToken: z.string().min(1),
  oauthTokenSecret: z.string().min(1),
});

/** Normalized USOS user profile for access checks and display. */
export const usosUserProfileSchema = z.object({
  id: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
  studentNumber: z.string().nullable(),
  staffStatus: z.number().int().min(0).max(2).nullable(),
});

export const usosSignedHttpMethodSchema = z.enum(["GET", "POST"]);

export function usosUserResponseToProfile(
  user: z.infer<typeof usosUserResponseSchema>,
): z.infer<typeof usosUserProfileSchema> {
  return usosUserProfileSchema.parse({
    id: user.id,
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    studentNumber: user.student_number ?? null,
    staffStatus:
      typeof user.staff_status === "number" ? user.staff_status : null,
  });
}

export function oauthTokenParamsToRequestToken(
  params: z.infer<typeof oauthTokenParamsSchema>,
): z.infer<typeof usosRequestTokenSchema> {
  return usosRequestTokenSchema.parse({
    oauthToken: params.oauth_token,
    oauthTokenSecret: params.oauth_token_secret,
  });
}

export function oauthTokenParamsToAccessTokens(
  params: z.infer<typeof oauthTokenParamsSchema>,
  scopes: string,
): z.infer<typeof usosOAuthTokensSchema> {
  return usosOAuthTokensSchema.parse({
    accessToken: params.oauth_token,
    accessTokenSecret: params.oauth_token_secret,
    scopes,
  });
}

export function parseJsonBody<T>(
  schema: z.ZodType<T>,
  body: string,
  label: string,
): T {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`${label}: invalid JSON: ${body.slice(0, 200)}`);
  }

  const errorResult = usosApiErrorSchema.safeParse(json);
  if (errorResult.success) {
    const { error, message } = errorResult.data;
    throw new Error(`${label}: ${message ?? error}`);
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(formatZodError(label, result.error));
  }

  return result.data;
}

export function parseOAuthTokenParams(
  params: Record<string, string>,
  label: string,
): z.infer<typeof oauthTokenParamsSchema> {
  const result = oauthTokenParamsSchema.safeParse(params);
  if (!result.success) {
    throw new Error(formatZodError(label, result.error));
  }
  return result.data;
}
