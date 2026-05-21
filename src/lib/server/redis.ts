import { Redis } from "@upstash/redis";
import { env } from "$env/dynamic/private";
import { once } from "$lib/server/once";

export const getRedis = once(() => {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
  }
  return new Redis({ url, token });
});
