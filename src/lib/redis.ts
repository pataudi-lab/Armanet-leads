import IORedis from "ioredis";

const url = process.env.REDIS_URL || "redis://localhost:6379";

const globalForRedis = global as unknown as { redis?: IORedis };

export const redis = globalForRedis.redis || new IORedis(url);

if (!globalForRedis.redis) {
  globalForRedis.redis = redis;
}
