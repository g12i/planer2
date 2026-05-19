import type { ZodType, z } from "zod";

export async function http<TOut extends ZodType, TPayload>({
  method,
  url,
  schema,
  payload,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  url: string;
  schema: TOut;
  payload?: TPayload;
}): Promise<z.infer<TOut>>;

export async function http<TPayload>({
  method,
  url,
  payload,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  url: string;
  payload?: TPayload;
}): Promise<Response>;

export async function http<TOut extends ZodType, TPayload>({
  method,
  url,
  schema,
  payload,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
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

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (schema) {
    const rawJson = await response.json();

    const parsed = schema.parse(rawJson);

    return parsed as z.infer<TOut>;
  }

  return response;
}
