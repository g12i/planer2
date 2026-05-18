import { Redis } from "@upstash/redis";
import {
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
} from "$env/static/private";
import { once } from "$lib/server/once";

export const getRedis = once(
  () =>
    new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    }),
);
