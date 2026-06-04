import type { Middleware } from 'grammy'
import { BotError } from '../../domain/errors.js'
import type { AppContext } from '../context.js'

/**
 * Требует, чтобы chat был привязан к аккаунту.
 * Заполняет ctx.linkedUser и обновляет last_seen_at (best-effort).
 *
 * Используется как фильтр на ЗАЩИЩЁННЫХ командах:
 *   bot.command('reminders', requireLinkedAccount(), handler)
 */
export function requireLinkedAccount(): Middleware<AppContext> {
  return async (ctx, next) => {
    const chatId = ctx.chat?.id
    if (!chatId) {
      throw new BotError('validation', 'Это действие можно выполнить только в личном чате с ботом.')
    }

    const { accountLink } = ctx.container.services
    const linked = await accountLink.getByChatId(chatId)
    if (!linked) {
      throw new BotError('account_not_linked', 'Аккаунт не подключён')
    }

    ctx.linkedUser = linked
    // best-effort: не блокируем основную логику, если не получилось
    void ctx.container.repositories.telegramUsers
      .touchLastSeen(linked.userId)
      .catch(() => undefined)

    await next()
  }
}
