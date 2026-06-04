import { getClientIp } from './client-ip'
import { checkDistributedWindow } from './redis-window'

const WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000)
const SIGN_IN_MAX_PER_IP = Number(process.env.AUTH_SIGN_IN_MAX_PER_IP ?? 10)
const SIGN_IN_MAX_PER_EMAIL = Number(process.env.AUTH_SIGN_IN_MAX_PER_EMAIL ?? 5)
const SIGN_UP_MAX_PER_IP = Number(process.env.AUTH_SIGN_UP_MAX_PER_IP ?? 5)

export type AuthRateLimitAction = 'sign-in' | 'sign-up'

export async function checkAuthRateLimit(
  request: Request,
  action: AuthRateLimitAction,
  email?: string,
): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number }> {
  const ip = getClientIp(request)

  if (action === 'sign-up') {
    return checkDistributedWindow(`auth:sign-up:ip:${ip}`, SIGN_UP_MAX_PER_IP, WINDOW_MS)
  }

  const byIp = await checkDistributedWindow(`auth:sign-in:ip:${ip}`, SIGN_IN_MAX_PER_IP, WINDOW_MS)
  if (!byIp.allowed) return byIp

  const normalized = email?.trim().toLowerCase()
  if (!normalized) return { allowed: true }

  return checkDistributedWindow(
    `auth:sign-in:email:${normalized}`,
    SIGN_IN_MAX_PER_EMAIL,
    WINDOW_MS,
  )
}
