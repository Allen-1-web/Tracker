import Redis from 'ioredis'
import { checkSlidingWindow } from './sliding-window'

let client: Redis | null = null
let connectFailed = false

function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim()
  if (!url || connectFailed) return null

  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
    })
    client.on('error', () => {
      connectFailed = true
    })
  }

  return client
}

/** Fixed-window counter in Redis; falls back to in-memory per instance. */
export async function checkDistributedWindow(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number }> {
  const redis = getRedisClient()
  if (!redis) {
    return checkSlidingWindow(key, max, windowMs)
  }

  const redisKey = `tracker:rl:${key}`

  try {
    if (redis.status === 'wait') {
      await redis.connect()
    }
    if (redis.status !== 'ready') {
      return checkSlidingWindow(key, max, windowMs)
    }

    const count = await redis.incr(redisKey)
    if (count === 1) {
      await redis.pexpire(redisKey, windowMs)
    }

    const ttlMs = await redis.pttl(redisKey)
    const retryAfterSec = Math.max(1, Math.ceil((ttlMs > 0 ? ttlMs : windowMs) / 1000))

    if (count > max) {
      return { allowed: false, retryAfterSec }
    }

    return { allowed: true }
  } catch {
    return checkSlidingWindow(key, max, windowMs)
  }
}
