import type { Middleware } from 'grammy'
import { BotError } from '../../domain/errors.js'
import type { AppContext } from '../context.js'

const WINDOW_MS = 600
const lastActionAt = new Map<number, number>()

/** Простой per-chat rate limit (без Redis — достаточно для Stage 3). */
export function rateLimitPerChat(): Middleware<AppContext> {
  return async (ctx, next) => {
    const chatId = ctx.chat?.id
    if (chatId == null) return next()

    const now = Date.now()
    const prev = lastActionAt.get(chatId) ?? 0
    if (now - prev < WINDOW_MS) {
      throw new BotError('rate_limited', 'Слишком много запросов')
    }
    lastActionAt.set(chatId, now)
    await next()
  }
}
