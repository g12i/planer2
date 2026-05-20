import type { ZodType, z } from "zod";

function errorMessageFromBody(body: unknown, status: number): string {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }

  return `HTTP error! status: ${status}`;
}

function isLoginRedirect(response: Response): boolean {
  if (!response.redirected) return false;
  const finalUrl = new URL(response.url);
  return finalUrl.pathname === "/login";
}

export async function http<TOut extends ZodType, TPayload>({
  method,
  url,
  schema,
  payload,
}: {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  schema: TOut;
  payload?: TPayload;
}): Promise<z.infer<TOut>>;

export async function http<TPayload>({
  method,
  url,
  payload,
}: {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  payload?: TPayload;
}): Promise<Response>;

export async function http<TOut extends ZodType, TPayload>({
  method,
  url,
  schema,
  payload,
}: {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  schema?: TOut;
  payload?: TPayload;
}): Promise<z.infer<TOut> | Response> {
  const request = new Request(url, {
    method,
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  if (payload) {
    request.headers.set("Content-Type", "application/json");
  }

  const response = await fetch(request);

  if (isLoginRedirect(response)) {
    window.location.href = "/logout";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    throw new Error(errorMessageFromBody(body, response.status));
  }

  if (schema) {
    const rawJson = await response.json();

    const parsed = schema.parse(rawJson);

    return parsed as z.infer<TOut>;
  }

  return response;
}
