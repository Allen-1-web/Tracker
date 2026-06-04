import { Bot } from 'grammy'
import type { Container } from '../../app/container.js'
import type { AppContext } from '../../presentation/context.js'
import { injectContainer } from '../../presentation/middleware/inject.js'
import { makeErrorHandler } from '../../presentation/middleware/error.js'
import { rateLimitPerChat } from '../../presentation/middleware/rate-limit.js'
import { commands } from '../../presentation/commands/index.js'
import { trackerCallbacks } from '../../presentation/callbacks/tracker.js'
import { reminderCallbacks } from '../../presentation/callbacks/reminders.js'

/**
 * Фабрика grammY бота со всеми middleware и обработчиками.
 * Не запускает polling/webhook — это делают entry-point'ы в app/.
 */
export function createBot(container: Container): Bot<AppContext> {
  const bot = new Bot<AppContext>(container.config.telegram.token)

  bot.use(injectContainer(container))
  bot.use(rateLimitPerChat())
  bot.use(trackerCallbacks)
  bot.use(reminderCallbacks)
  bot.use(commands)

  bot.catch(makeErrorHandler())

  return bot
}
