import { Redis } from "@upstash/redis";

type RedisClient = ReturnType<typeof Redis.fromEnv>;

const hasRedisEnv =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis: RedisClient | null = hasRedisEnv ? Redis.fromEnv() : null;
