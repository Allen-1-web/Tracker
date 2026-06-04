import { Redis, type RedisOptions } from 'ioredis'
import type { AppConfig } from '../config.js'

/** Shared Redis connection options for BullMQ (maxRetriesPerRequest must be null). */
export function createRedisConnection(config: AppConfig): Redis {
  return new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  } satisfies RedisOptions)
}
