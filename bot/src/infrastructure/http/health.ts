import type { Redis } from 'ioredis'
import type { TelegramUserRepository } from '../supabase/repositories/telegram-user.repository.js'

export type HealthCheckName = 'supabase' | 'redis'

export type HealthCheckResult = {
  status: 'ok' | 'error'
  latencyMs?: number
  error?: string
}

export type HealthReport = {
  status: 'ok' | 'degraded'
  uptimeSec: number
  checks: Record<HealthCheckName, HealthCheckResult>
}

const startedAt = Date.now()

export async function checkSupabase(
  telegramUsers: TelegramUserRepository,
): Promise<HealthCheckResult> {
  const t0 = Date.now()
  try {
    await telegramUsers.findByChatId(0)
    return { status: 'ok', latencyMs: Date.now() - t0 }
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function checkRedis(redis: Redis | null): Promise<HealthCheckResult> {
  if (!redis) {
    return { status: 'error', error: 'redis not configured' }
  }
  const t0 = Date.now()
  try {
    const pong = await redis.ping()
    if (pong !== 'PONG') {
      return { status: 'error', latencyMs: Date.now() - t0, error: `unexpected ping: ${pong}` }
    }
    return { status: 'ok', latencyMs: Date.now() - t0 }
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function buildHealthReport(args: {
  telegramUsers: TelegramUserRepository
  redis: Redis | null
}): Promise<HealthReport> {
  const [supabase, redisCheck] = await Promise.all([
    checkSupabase(args.telegramUsers),
    checkRedis(args.redis),
  ])

  const checks = { supabase, redis: redisCheck }
  const status = Object.values(checks).every((c) => c.status === 'ok') ? 'ok' : 'degraded'

  return {
    status,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    checks,
  }
}
