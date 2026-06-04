import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type MockRedis = {
  status: string
  connect: ReturnType<typeof vi.fn>
  incr: ReturnType<typeof vi.fn>
  pexpire: ReturnType<typeof vi.fn>
  pttl: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
}

const { redisInstances, MockRedisClient } = vi.hoisted(() => {
  const redisInstances: MockRedis[] = []

  const MockRedisClient = vi.fn(function createMockRedis() {
    const instance: MockRedis = {
      status: 'ready',
      connect: vi.fn().mockResolvedValue(undefined),
      incr: vi.fn().mockResolvedValue(1),
      pexpire: vi.fn().mockResolvedValue(1),
      pttl: vi.fn().mockResolvedValue(60_000),
      on: vi.fn(),
    }
    redisInstances.push(instance)
    return instance
  })

  return { redisInstances, MockRedisClient }
})

vi.mock('ioredis', () => ({
  default: MockRedisClient,
}))

function latestRedis(): MockRedis {
  const instance = redisInstances.at(-1)
  if (!instance) throw new Error('Redis mock was not constructed')
  return instance
}

describe('checkDistributedWindow', () => {
  const originalRedisUrl = process.env.REDIS_URL

  beforeEach(() => {
    vi.resetModules()
    redisInstances.length = 0
    MockRedisClient.mockClear()
    delete process.env.REDIS_URL
  })

  afterEach(() => {
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL
    } else {
      process.env.REDIS_URL = originalRedisUrl
    }
  })

  it('uses in-memory fallback when REDIS_URL is not set', async () => {
    const { checkDistributedWindow } = await import('@/lib/rate-limit/redis-window')
    const key = `mem-${Date.now()}`

    expect(await checkDistributedWindow(key, 2, 60_000)).toEqual({ allowed: true })
    expect(await checkDistributedWindow(key, 2, 60_000)).toEqual({ allowed: true })

    const blocked = await checkDistributedWindow(key, 2, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(MockRedisClient).not.toHaveBeenCalled()
  })

  it('increments Redis counter when REDIS_URL is configured', async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:6379'

    const { checkDistributedWindow } = await import('@/lib/rate-limit/redis-window')

    const result = await checkDistributedWindow('auth:sign-in:ip:1.2.3.4', 10, 900_000)
    const redis = latestRedis()

    expect(result).toEqual({ allowed: true })
    expect(MockRedisClient).toHaveBeenCalledTimes(1)
    expect(redis.incr).toHaveBeenCalledWith('tracker:rl:auth:sign-in:ip:1.2.3.4')
    expect(redis.pexpire).toHaveBeenCalledWith('tracker:rl:auth:sign-in:ip:1.2.3.4', 900_000)
  })

  it('returns retryAfterSec when Redis count exceeds max', async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:6379'

    const { checkDistributedWindow } = await import('@/lib/rate-limit/redis-window')

    await checkDistributedWindow('auth:sign-up:ip:9.9.9.9', 10, 900_000)

    const redis = latestRedis()
    redis.incr.mockResolvedValueOnce(11)
    redis.pttl.mockResolvedValueOnce(120_000)

    const result = await checkDistributedWindow('auth:sign-up:ip:9.9.9.9', 10, 900_000)

    expect(result).toEqual({ allowed: false, retryAfterSec: 120 })
  })

  it('falls back to in-memory when Redis commands fail', async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:6379'

    MockRedisClient.mockImplementationOnce(() => {
      const instance: MockRedis = {
        status: 'ready',
        connect: vi.fn().mockResolvedValue(undefined),
        incr: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
        pexpire: vi.fn(),
        pttl: vi.fn(),
        on: vi.fn(),
      }
      redisInstances.push(instance)
      return instance
    })

    const { checkDistributedWindow } = await import('@/lib/rate-limit/redis-window')
    const key = `fallback-${Date.now()}`

    expect(await checkDistributedWindow(key, 2, 60_000)).toEqual({ allowed: true })
    expect(await checkDistributedWindow(key, 2, 60_000)).toEqual({ allowed: true })
  })
})
